/* How to use Thread */

var sync = require('../lib/main').sync5;
var co = sync.co;
var proc = sync.proc;
var $let = sync.$let;
var $get = sync.$get;
var lift = sync.lift;
var sleep = sync.sleep;
var Thread = sync.Thread;


var printNumbers = co(function*(label) {
    for (var i = 0; i < 10; i++) {
        console.log(label + ':' + i);
        /*
         if (label == 'a' && i == 5) {
         throw new Error('foobar');
         }
         */
        yield* sync.sleep(500 * Math.random());
    }
    return label + ':' + 100;
});

var threadTest = co(function*() {
    var thread1 = yield* sync.Thread.fork(co(function*() {
        return yield* printNumbers('a');
    }));

    var thread2 = yield* sync.Thread.fork(co(function*() {
        return yield* printNumbers('b');
    }));

    var res1 = yield* thread1.join();
    var res2 =  yield* thread2.join();
    return [res1, res2];
});

var threadTest2 = co(function*() {
    return yield* sync.Thread.select(
        co(function*() {
            return yield* printNumbers('a');
        }),
        co(function*() {
            return yield* printNumbers('b');
        })
    );

});

var threadTest3 = co(function*() {
    return yield* sync.Thread.timeout(
        2.6 * 1000,
        threadTest2
    );
});


var main = co(function*() {
    return yield* threadTest3();
});

proc(main)()({a: 1}, function(err, res) {
    if (err) {
        console.log('Error:', err);
    } else {
        console.log('Ok:', res);
    }
});


