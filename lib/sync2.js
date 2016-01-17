
module.exports = function() {
    var implicit = function (k) {
        return function (env, cb) {
            cb(null, env[k]);
        };
    };

    var letImplicit = function (ext, proc) {
        return function (env, cb) {
            proc(extScope(env, ext), cb);
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

    var getStack = function() {
        try {
            foobar;
        } catch(e) {
            return e;
        }
    };

    var extractKeyLine = function(e) {
        return e.stack.split('\n')[3];
    };

    var attachGeneratorStack = function(e, e0) {
        if (!e.__generatorStack__) {
            // e.__generatorStack__ = [];
            e.__generatorStack__ = [e.stack.split('\n')[1]];
        }
        e.__generatorStack__.push(extractKeyLine(e0));
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
            attachGeneratorStack(e, e0);
            cb(e);
        }

    };

    var proc = function(pstar) {
        return function() {var me = this; var args = arguments; var e0 = getStack(); return function(env, cb) {
            try {
                var gen = pstar.apply(me, args);
                recurse(gen, null, null, env, cb, e0);
            } catch(e) {
                cb(e);
            }
        };};
    };

    return {
        proc: proc,
        implicit: implicit,
        letImplicit: letImplicit        
    };
}();
