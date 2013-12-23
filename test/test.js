Error.stackTraceLimit = Infinity;

var proc = require('../lib/sync');

var cb = function(err, res) {
    if (err) {
        console.log('cb ERROR', err);
    } else {
        console.log('OK', res);
    }
};

var remoteAdd = proc(function*(a, b) {
    try{
        yield function(cb) {
            setTimeout(
                function() {
                    if (b == 1) {
                        cb(new Error('error on 5'));
                    } else {
                        cb();
                    }
                },
                1000
            );
        };

    } catch(e) {
        throw e;
        // console.log('catch error');
    }

    return (a+b);
});


var remoteSum = proc(function*(n) {
    var res = 0;

    try {
        for (i = 0; i < n; i++) {
            res = yield remoteAdd(res, i);
            console.log(res);
        }

        return res;
    } catch(e) {
        return 'catch error on 5';
    }
});

// remoteSum(10)(cb);
var main = proc(function*() {
    try {
        var res = yield remoteAdd(2, 1);
        console.log('res: ', res);
        return res;
    } catch(e) {
        console.log('catch err in main');
    }
});

main()(cb);


