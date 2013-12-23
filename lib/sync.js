
var toProc = function(pstar) {
    var recurse = function(gen, value, cb) {
        var stepRes = gen.next(value);
        if (stepRes.done) {
            cb(null, stepRes.value);
        } else {
            var proc = stepRes.value;
            proc(function(err, res) {
                if (err) {
                    gen.throw(err);
                } else {
                    recurse(gen, res, cb);
                }
            });
        }
    };

    return function() {var me = this; var args = arguments; return function(cb) {
        try {
            var gen = pstar.apply(me, args);
            recurse(gen, null, cb);
        } catch(e) {
            cb(e);
        }
    };};
};

module.exports = toProc;
