/* How to emulate thread local state */

var sync = require('../lib/main').sync5;
var co = sync.co;
var proc = sync.proc;
var $get = sync.$get;
var $let = sync.$let;
var lift = sync.lift;

var read = co(function*(k) {
    var state = yield* $get('__state__');
    return state[k];
});

var write = co(function*(k, v) {
    var state = yield* $get('__state__');
    state[k] = v;
});

var mul = function(a, b, cb) {
    setTimeout(function() {
        cb(null, a*b);
    }, 1000);
};

var square = co(function*(a) {
    var coeff = yield* read('coeff');
    console.log(coeff);
    return coeff * (yield* lift(mul)(a, a));
});

var squareSum = co(function*(a, b) {
    var a2 = yield* square(a);
    var b2 = yield* square(b);
    return Math.sqrt(a2 + b2);
});

var main = co(function*(list) {
    yield* write('coeff', 100);

    var res = 0;

    for (var i = 0; i < list.length; i++) {
        var tmp = yield* square(list[i]);
        res = res + tmp;
    }

    return res;
});


var cb = function(err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};

sync.proc(main)([3,4])({__state__: {}}, cb);