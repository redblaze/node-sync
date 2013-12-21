var toProc = require('../lib/sync');

var cb = function(err, res) {
    if (err) {
        console.log('ERROR', err);
    } else {
        console.log('OK', res);
    }
};

var p1 = function*(a, b) {
    console.log('start p1');
    var c = yield function(cb) {
        setTimeout(
            function() {
                cb(null, 1);
            },
            1000
        );
    };
    console.log(c);
    return (a+b);
};

var p2 = function*(a, b) {
    console.log('start p2');

    return 4 + (yield toProc(p1)(1,2));
};

var p3 = function*(n) {
    var res = 0;

    for (i = 0; i < n; i++) {
        res = yield toProc(p1)(res, i);
    }

    return res;
};

toProc(p3)(10)(cb);
