var sync = function() {
    var co = function(g) {
        return new Proxy(g, {
            apply: function*(me, subject, args) {
                try {
                    return yield* me.apply(subject, args);
                } catch(e) {
                    var frame = getStack(arguments.callee);
                    attachGeneratorStack(e, frame, 'co');
                    throw e;
                }
            }
        });
    };

    var $get = co(function*(k) {
        return yield function(e, cb) {
            cb(null, e[k]);
        };
    });

    var $let = function(ext, gfn, context) {
        return co(function*() {
            var me = this;
            var args = arguments;
            return yield function(e, cb) {
                var subject = context == null? me: context;
                proc(gfn).apply(subject, args)(extScope(e, ext), cb);
            };
        });
    };

    var extScope = function (env, ext) {
        var res = {};
        for (var k in env) {
            res[k] = env[k];
        }
        for (var k in ext) {
            res[k] = ext[k];
        }
        return res;
    };

    var getStack = function(cap) {
        cap = cap || arguments.callee;
        var save = Error.stackTraceLimit;
        Error.stackTraceLimit = 2;
        var o = {};
        Error.captureStackTrace(o, cap);
        Error.stackTraceLimit = save;
        return o.stack;
    };


    var attachGeneratorStack = function(e, e0, tag) {
        if (!e.stack) {
            console.log('error?', e);
            console.trace();
        }
        if (!e.__generatorStack__) {
            e.__generatorStack__ = [];
        }

        var prefix = (tag || '') + ': ';
        e.__generatorStack__.push(prefix + e0);
    };


    var recurse = function(gen, err, value, env, cb, e0) {
        var stepRes;

        try {
            if (err != null) {
                stepRes = gen.throw(err);
            } else {
                stepRes = gen.next(value);
            }

            if (stepRes.done) {
                cb(null, stepRes.value);
            } else {
                var proc = stepRes.value;
                try {
                    proc(env, function(err, res) {
                        if (err != null) {
                            recurse(gen, err, null, env, cb, e0);
                        } else {
                            recurse(gen, null, res, env, cb, e0);
                        }
                    });
                } catch(err) {
                    recurse(gen, err, null, env, cb, e0);
                }
            }
        } catch(e) {
            attachGeneratorStack(e, e0, 'proc');
            cb(e);
        }

    };

    var proc = function(pstar, context) {
        return function() {
            var me = this;
            var args = arguments;
            var gen = pstar.apply(context || me, args);
            var e0 = getStack(arguments.callee);
            return function(env, cb) {
                try {
                    // var gen = pstar.apply(me, args);
                    recurse(gen, null, null, env, cb, e0);
                } catch(e) {
                    cb(e);
                }
            };
        };
    };

    var lift0 = function(afn, context) {
        return function() {
            var me = this;

            var args = [];
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }

            return function(env, cb) {
                afn.apply(context || me, args.concat([cb]));
            }
        };
    };

    var lift = function(afn0, context) {
        var afn = lift0(afn0, context);
        return co(function*() {
            return yield afn.apply(context || this, arguments);
        });
    };

    var sleep = co(function*(time) {
        yield function(e, cb) {
            setTimeout(function() {
                cb();
            }, time);
        };
    });

    // Thread

    var Thread = function() {
        this._init.apply(this, arguments);
    };

    Thread.prototype = {
        _init: function(gfn) {
            this._gfn = gfn;

            this._state = 'start';
        },

        start: function(e0) {
            var me = this;

            if (me._state != 'start') {
                throw new Error('Thread.run: illegal thread state' + me._state);
            }

            me._state = 'running';

            var e = extScope(e0, {});

            var cb = function(err, res) {
                if (err) {
                    console.log(err);
                }

                if (me._cb) {
                    me._cb(err, res);
                } else {
                    if (err) {
                        me._state = 'error';
                        me._err = err;
                    } else {
                        me._state = 'end';
                        me._res = res;
                    }
                }

            };

            proc(this._gfn)()(e, cb);
        },

        join: co(function*() {
            var me = this;

            switch(this._state) {
                case 'start':
                    throw Error('Thread.join: cannot not join unstarted thread');
                case 'running':
                    this._state = 'joining';
                    return yield function(e, cb) {
                        me._cb = cb;
                    }
                    break;
                case 'joining':
                    throw new Error('Thread.join: cannot join thread more than once')
                case 'error':
                    throw this._err;
                case 'end':
                    return this._res;
                default:
                    throw new Error('Uknown thread state: ' + this._state);
            }
        })
    };

    Thread.fork = co(function*(gfn) {
        var env = yield function(e, cb) {
            cb(null, e);
        };

        var thread = new Thread(gfn);
        thread.start(env);
        return thread;
    });

    Thread.select = co(function*(gfn1, gfn2) {
        // states are: start, error, done
        var state1 = 'start';
        var state2 = 'start';
        var res1, res2, err1, err2;

        var _cb;

        var cb1 = function(err, res) {
            if (err) {
                state1 = 'error';
                err1 = err;

                switch (state2) {
                    case 'start':
                        break;
                    case 'error':
                        _cb(err);
                        break;
                    case 'done':
                        break;
                    default:
                        throw new Error('Thread.select: Invalid state ' + state2);
                }
            } else {
                state1 = 'done';
                res1 = res;

                switch(state2) {
                    case 'start':
                    case 'error':
                        _cb(null, res1);
                        break;
                    case 'done':
                        break;
                    default:
                        throw new Error('Thread.select: Invalid state ' + state2);
                }

            }
        };

        var cb2 = function(err, res) {
            if (err) {
                state2 = 'error';
                err2 = err;

                switch (state1) {
                    case 'start':
                        break;
                    case 'error':
                        _cb(err);
                        break;
                    case 'done':
                        break;
                    default:
                        throw new Error('Thread.select: Invalid state ' + state1);
                }
            } else {
                state2 = 'done';
                res2 = res;

                switch(state1) {
                    case 'start':
                    case 'error':
                        _cb(null, res2);
                        break;
                    case 'done':
                        break;
                    default:
                        throw new Error('Thread.select: Invalid state ' + state1);
                }
            }
        };


        return yield function(e, cb) {
            _cb = cb;

            proc(gfn1)()(e, cb1);
            proc(gfn2)()(e, cb2);
        };
    });

    Thread.timeout = co(function*(time, gfn) {
        var _timeout = false;

        var res = yield* Thread.select(
            co(function*() {
                yield function(e, cb) {
                    setTimeout(function() {
                        _timeout = true;
                        cb();
                    }, time);
                }
            }),
            gfn
        );

        if (_timeout) {
            throw new Error('timeout');
        } else {
            return res;
        }
    });

    return {
        proc: proc,
        $get: $get,
        $let: $let,
        lift0: lift0,
        lift: lift,
        sleep: sleep,
        co: co,
        Thread: Thread
    };
}();

module.exports = sync;
