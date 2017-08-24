Error.stackTraceLimit = Infinity;

var sync = require('../lib/main').sync3;
var co = sync.proc;
var implicit = sync.implicit;
var letImplicit = sync.letImplicit;
var getState = sync.getState;
var setState = sync.setState;
var lift = sync.lift;

var mul = function(a, b, cb) {
    setTimeout(function() {
        cb(null, a*b);
    }, 1000);
};

var square = co(function*(a) {
    var coeff = yield getState('coeff');
    console.log(coeff);
    return coeff * (yield lift(mul)(a, a));
});

var squareSum = co(function*(a, b) {
    var a2 = yield square(a);
    var b2 = yield square(b);
    return Math.sqrt(a2 + b2);
});

var main = co(function*(list) {
    yield setState('coeff', 100);

    var res = 0;

    for (var i = 0; i < list.length; i++) {
        var tmp = yield square(list[i]);
        res = res + tmp;
    }

    return res;
});


var cb = function(s, err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};

// squareSum(3,4)({a:2}, {}, cb);
main([3,4])({a:2}, {}, cb);