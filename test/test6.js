var sync = require('../lib/main').sync4;
var co = sync.co;
var proc = sync.proc;
var implicit = sync.implicit;
var letImplicit = sync.letImplicit;
var getState = sync.getState;
var setState = sync.setState;
var lift = sync.lift;
var sleep = sync.sleep;
var Thread = sync.Thread;


var sleep0 = function(time, error, cb) {
    setTimeout(function() {
        if (error) {
            cb(new Error('foobar'));
        } else {
            cb();
        }
    }, time);
};

var sleep2 = co(function*(time) {
    yield function(e, s, cb) {
    };
});


var g = co(function*(x) {
    console.log('calling g with', x);
    yield* sync.lift(sleep0)(1000, true);
    // yield sync.lift0(sleep0)(1000, true);
    // yield* sleep2(1000);
    // throw new Error('foobar2');
    return x;
});


var f = co(function*() {
    var g0 = co(function*(x) {
        return yield proc(g)(x);
    });

    return yield* g0(100);
});

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
    // yield* printNumbers('a');

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

proc(main)()({a: 1}, {}, function(s, err, res) {
    if (err) {
        console.log('Error:', err);
    } else {
        console.log('Ok:', res);
    }
});


