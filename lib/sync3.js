
module.exports = function() {
    var implicit = function (k) {
        return function (env, state, cb) {
            cb(state, null, env[k]);
        };
    };

    var letImplicit = function (ext, proc) {
        return function (env, state, cb) {
            proc(extScope(env, ext), state, cb);
        };
    };

    var getState = function(k) {
        return function(env, state, cb) {
            console.log(state);
            cb(state, null, state[k]);
        }
    };

    var setState = function(k, v) {
        return function(env, state, cb) {
            var ext = {};
            ext[k] = v;
            console.log('ext', ext);
            cb(extScope(state, ext), null, null);
        };
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
    /*
    var getStack = function() {
        try {
            foobar;
        } catch(e) {
            return e;
        }
    };
    */

    var getStack = function(cap) {
        cap = cap || arguments.callee;
        var save = Error.stackTraceLimit;
        Error.stackTraceLimit = 1;
        var o = {};
        Error.captureStackTrace(o, cap);
        Error.stackTraceLimit = save;
        return o.stack;
    };


    var extractKeyLine = function(e) {
        return e.stack.split('\n')[3];
    };

    var attachGeneratorStack = function(e, e0) {
        if (!e.stack) {
            console.log('error?', e);
        }
        if (!e.__generatorStack__) {
            e.__generatorStack__ = [];
            // e.__generatorStack__ = [e.stack.split('\n')[1]];
        }
        // e.__generatorStack__.push(extractKeyLine(e0));
        e.__generatorStack__.push(e0);
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
            attachGeneratorStack(e, e0);
            cb(state, e);
        }

    };

    var proc = function(pstar) {
        return function() {var me = this; var args = arguments; var e0 = getStack(arguments.callee); return function(env, state, cb) {
            try {
                var gen = pstar.apply(me, args);
                recurse(gen, null, null, env, state, cb, e0);
            } catch(e) {
                cb(state, e);
            }
        };};
    };

    var lift = function(afn, context) {
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

    var sleep = proc(function*(time) {
        yield function(e, s, cb) {
            setTimeout(function() {
                cb(s);
            }, time);
        };
    });

    return {
        proc: proc,
        implicit: implicit,
        letImplicit: letImplicit,
        getState: getState,
        setState: setState,
        lift: lift,
        sleep: sleep
    };
}();
