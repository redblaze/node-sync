Error.stackTraceLimit = Infinity;

var sync = require('../lib/main');
var proc = sync.proc2;
var implicit = sync.implicit;
var letImplicit = sync.letImplicit;
var clo = sync.closure;

var monitor = proc(function*() {
    // var me = this;

    console.log('monitor starts');

    var totalSent = yield function(_, cb) {
        setTimeout(function() {
            // cb(new Error('foobar'));
            try {
                me;
                cb(null, _['a'] || 1);
            } catch(e) {
                cb(e);
            }
            // cb(null, 1);
        }, 1000);
    };

    console.log(totalSent);
    return totalSent;
});

var cb = function(err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};

// monitor()({}, cb);

clo(monitor)
    .inEnv({a: 2})
    .success(function(res) {
        console.log('OK: ', res);
    })
    .fail(function(err) {
        console.log('just error');
    })
    .run();
