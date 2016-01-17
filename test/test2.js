
Error.stackTraceLimit = Infinity;

var sync = require('../lib/main');
var proc = sync.proc2;
var implicit = sync.implicit;
var letImplicit = sync.letImplicit;

var cb = function(err, res) {
	if (err) {
		console.log('cb ERROR', err.stack);
		console.log(err.__generatorStack__);
	} else {
		console.log('OK', res);
	}
};

var square = proc(function*(a) {
	var co = yield implicit('co') || 1;
	return yield(function(env, cb) {
	// throw new Error('foobar');
		setTimeout(function() {
			console.log('co is: ', co);
			console.log('compute square: ', co*a*a);
			// cb(null, co*a*a);
			cb(new Error('foobar'));
		}, 1000);
	});
});

var remoteAdd = proc(function*(a, b) {
	try {
		var a2 = yield letImplicit({co: 3}, square(a));

		var b2 = yield square(b);

		return a2 + b2;
	} catch(e) {
		throw e;
		return 100;
	}
});

remoteAdd(1, 2)({co: 5}, cb);
