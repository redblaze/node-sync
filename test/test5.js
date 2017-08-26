var sync = require('../lib/main').sync3;
var co = sync.proc;
var implicit = sync.implicit;
var letImplicit = sync.letImplicit;
var getState = sync.getState;
var setState = sync.setState;
var lift = sync.lift;
var parallel = sync.parallel;
var sleep = sync.sleep;


var printSequence = co(function*(s) {
    for (var i = 0; i < 20; i++) {
        console.log(s + i);
        yield sleep(500 * Math.random());
    }
});

var main = co(function*() {
    yield printSequence('a');
    yield printSequence('b');
    yield parallel([printSequence('a'), printSequence('b')]);
});

var cb = function(s, err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};

main()({}, {}, cb);