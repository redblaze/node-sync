
module.exports = function() {
    var recurse = function(gen, err, value, cb) {
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
                            recurse(gen, err, null, cb);
                        } else {
                            recurse(gen, null, res, cb);
                        }
                    });
                } catch(err) {
                    recurse(gen, err, null, cb);
                }
            }
        } catch(e) {
            cb(e);
        }

    };

    var proc = function(pstar) {
        return function() {var me = this; var args = arguments; return function(cb) {
            try {
                var gen = pstar.apply(me, args);
                recurse(gen, null, null, cb);
            } catch(e) {
                cb(e);
            }
        };};
    };

    return proc;
}();
