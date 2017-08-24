Error.stackTraceLimit = Infinity;

var proc = require('../lib/main').proc;

var cb = function(err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};


var remoteAdd = proc(function*(a, b) {
    try {
        var c = yield function(cb) {
            setTimeout(
                function() {
                    if (b == 5) {
                        cb (new Error('foobar'));
                    } else {
                        cb(null, a + b);
                    }
                },
                1000
            );
        };
        return c;
    } catch(e) {
        console.log('catch error in remoteAdd');
        throw e;
        // return a + b;
    }
});

var remoteSum = proc(function*(n) {
    try {
        var res = 0;

        for (i = 0; i < n; i++) {
            res = yield remoteAdd(res, i);
            console.log(res);
        }

        return res;
    } catch(e) {
        // console.log(e);
        console.log('catch err in remoteSum');
        console.log('~~~~~~~');
        console.log('log error in remoteSum: ', e.stack);
        console.log(e.__generatorStack__);
        console.log('~~~~~~~');
        throw e;
        // return 'swallow error in remoteSum';
    }
});

var main = proc(function*() {
    try {
        var res = yield remoteSum(10);
        console.log('success in main');
        return res;
    } catch(e) {
        console.log('catch err in main');
        console.log('======');
        console.log('log error in main: ', e.stack);
        console.log(e.__generatorStack__);
        console.log('======');
        throw(e);
    }
});

main()(cb);



