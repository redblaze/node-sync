/* How to lift a common async function to a generator */

var sync = require('../lib/main').sync5;
var co = sync.co;
var proc = sync.proc;
var lift = sync.lift;

var _remoteAdd = function(a, b, cb) {
    setTimeout(function() {
        cb(null, a+b);
    }, 1000);
};

var add = co(function*(a, b) {
    return yield* lift(_remoteAdd)(a, b);
});

var nSum = co(function*(n){
    var res = 0;
    for (var i = 0; i < n; i++) {
        res = yield* add(res, i)
        console.log(res);
    }
    return res;
});

var main = co(function*() {
    return yield* nSum(10);
});

var cb = function(err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};

proc(main)()({}, cb);



