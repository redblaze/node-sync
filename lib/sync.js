
var toProc = function(pstar) {
    var recurse = function(gen, value, cb) {
        var stepRes = gen.next(value);
        if (stepRes.done) {
            console.log(stepRes);
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
        var gen = pstar.apply(me, args);
        recurse(gen, null, cb);
    };};
};

module.exports = toProc;
