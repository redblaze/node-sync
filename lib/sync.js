
module.exports = function() {
    var getStack = function() {
        try {
            foobar;
        } catch(e) {
            return e;
        }
    };

    var printStack = function(e) {
        console.log('===========');
        console.log(e.stack);
        console.log('===========');
    };


    var recurse = function(gen, err, value, cb, e0) {
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
                    proc(function(err, res) {
                        if (err != null) {
                            recurse(gen, err, null, cb, e0);
                        } else {
                            recurse(gen, null, res, cb, e0);
                        }
                    });
                } catch(err) {
                    recurse(gen, err, null, cb, e0);
                }
            }
        } catch(e) {
            printStack(e0);
            cb(e);
        }

    };

    var proc = function(pstar) {
        return function() {var me = this; var args = arguments; var e0 = getStack(); return function(cb) {
            try {
                var gen = pstar.apply(me, args);
                recurse(gen, null, null, cb, e0);
            } catch(e) {
                cb(e);
            }
        };};
    };

    return proc;
}();
