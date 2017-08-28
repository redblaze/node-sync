var sync = function() {
    var co = function(g) {
        var name = '__generator_stack__';

        var gp = new Proxy(g, {
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

        return gp;
    };

    var implicit = co(function*(k) {
        return yield function(env, state, cb) {
            cb(state, null, env[k]);
        };
    });

    var letImplicit = function(ext, gfn, context) {
        return co(function*() {
            var me = this;
            var args = arguments;
            return yield function(e, s, cb) {
                var subject = context == null? me: context;
                proc(gfn).apply(subject, args)(extScope(e, ext), s, cb);
            };
        });
        /*
        return yield function (env, state, cb) {
            proc(extScope(env, ext), state, cb);
        };
        */
    };

    var getState = co(function*(k) {
        return yield function(env, state, cb) {
            // console.log(state);
            cb(state, null, state[k]);
        };
    });

    var setState = co(function*(k, v) {
        return yield function(env, state, cb) {
            var ext = {};
            ext[k] = v;
            // console.log('ext', ext);
            cb(extScope(state, ext), null, null);
        };
    });

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



    var extractKeyLine = function(e) {
        return e.stack.split('\n')[3];
    };

    var attachGeneratorStack = function(e, e0, tag) {
        if (!e.stack) {
            console.log('error?', e);
        }
        if (!e.__generatorStack__) {
            e.__generatorStack__ = [];
            // e.__generatorStack__ = [e.stack.split('\n')[1]];
        }
        // e.__generatorStack__.push(extractKeyLine(e0));
        var prefix = (tag || '') + ': ';
        e.__generatorStack__.push(prefix + e0);
    };


    var recurse = function(gen, err, value, env, state, cb, e0) {
        var stepRes;

        try {
            if (err != null) {
                stepRes = gen.throw(err);
            } else {
                stepRes = gen.next(value);
            }

            if (stepRes.done) {
                cb(state, null, stepRes.value);
            } else {
                var proc = stepRes.value;
                try {
                    proc(env, state, function(state, err, res) {
                        if (err != null) {
                            recurse(gen, err, null, env, state, cb, e0);
                        } else {
                            recurse(gen, null, res, env, state, cb, e0);
                        }
                    });
                } catch(err) {
                    recurse(gen, err, null, env, state, cb, e0);
                }
            }
        } catch(e) {
            attachGeneratorStack(e, e0, 'proc');
            cb(state, e);
        }

    };

    var proc = function(pstar) {
        return function() {
            var me = this;
            var args = arguments;
            var gen = pstar.apply(me, args);
            var e0 = getStack(arguments.callee);
            return function(env, state, cb) {
                try {
                    // var gen = pstar.apply(me, args);
                    recurse(gen, null, null, env, state, cb, e0);
                } catch(e) {
                    cb(state, e);
                }
            };
        };
    };

    var lift0 = function(afn, context) {
        return function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }

            return function(env, state, cb) {
                var cb0 = function(err, res) {
                    cb(state, err, res);
                };
                afn.apply(context, args.concat([cb0]));
            }
        };
    };

    var lift = function(afn0, context) {
        var afn = lift0(afn0, context);
        return co(function*() {
            return yield afn.apply(context, arguments);
        });
    };

    var sleep = co(function*(time) {
        yield function(e, s, cb) {
            setTimeout(function() {
                cb(s);
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

        start: function(e0, s0) {
            var me = this;

            if (me._state != 'start') {
                throw new Error('Thread.run: illegal thread state' + me._state);
            }

            me._state = 'running';

            var e = extScope(e0, {});
            var s = extScope(s0, {});

            var cb = function(s, err, res) {
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

            proc(this._gfn)()(e, s, cb);
        },

        join: co(function*() {
            var me = this;

            switch(this._state) {
                case 'start':
                    throw Error('Thread.join: cannot not join unstarted thread');
                case 'running':
                    this._state = 'joining';
                    return yield function(e, s, cb) {
                        me._cb = function(err, res) {
                            cb(s, err, res);
                        };
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
        var env = yield function(e, s, cb) {
            cb(s, null, e);
        };

        var state = yield function(e, s, cb) {
            cb(s, null, s);
        };

        // var env = {};
        // var state = {};

        var thread = new Thread(gfn);
        thread.start(env, state);
        return thread;
    });

    Thread.select = co(function*(gfn1, gfn2) {
        // states are: start, error, done
        var state1 = 'start';
        var state2 = 'start';
        var res1, res2, err1, err2;

        var _cb;

        var cb1 = function(s, err, res) {
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

        var cb2 = function(s, err, res) {
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


        return yield function(e, s, cb) {
            _cb = function(err, res) {
                console.log('_cb is called', err, res);
                cb(s, err, res);
            };

            proc(gfn1)()(e, s, cb1);
            proc(gfn2)()(e, s, cb2);
        };
    });

    Thread.timeout = co(function*(time, gfn) {
        var _timeout = false;

        var res = yield* Thread.select(
            co(function*() {
                yield function(e, s, cb) {
                    setTimeout(function() {
                        _timeout = true;
                        cb(s);
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
        implicit: implicit,
        letImplicit: letImplicit,
        getState: getState,
        setState: setState,
        lift0: lift0,
        lift: lift,
        sleep: sleep,
        co: co,
        Thread: Thread
    };
}();

module.exports = sync;
