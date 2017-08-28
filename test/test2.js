
Error.stackTraceLimit = Infinity;

var sync = require('../lib/main').sync4;
var co = sync.co;
var proc = sync.proc;
var $let = sync.letImplicit;
var $get = sync.implicit;
var $read = sync.getState;
var $write = sync.setState;

var cb = function(s, err, res) {
	if (err) {
		console.log('cb ERROR', err.stack);
		console.log(err.__generatorStack__);
	} else {
		console.log('OK', res);
	}
};

var square = co(function*(a) {
	var co = yield* $get('co') || 1;
	var count = (yield* $read('mult_count'));
	console.log('current count is:', count);
	if (count == null) {count = 0;};

	var res = yield(function(env, state, cb) {
	// throw new Error('foobar');
		setTimeout(function() {
			console.log('co is: ', co);
			console.log('compute square: ', co*a*a);
			cb(state, null, co*a*a);
			// cb(new Error('foobar'));
		}, 1000);
	});

	yield* $write('mult_count', count + 1);
	return res;
});

var remoteAdd = co(function*(a, b) {
	try {
		var a2 = yield* $let({co: 3}, square)(a);

		var b2 = yield* square(b);

		console.log('mult_count is: ', yield* $read('mult_count'));

		return a2 + b2;
	} catch(e) {
		throw e;
	}
});

proc(remoteAdd)(1, 2)({co: 5}, {}, cb);
