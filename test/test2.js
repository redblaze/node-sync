
Error.stackTraceLimit = Infinity;

var sync2 = require('../lib/sync2');
var proc = sync2.proc;
var implicit = sync2.implicit;
var letImplicit = sync2.letImplicit;

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
			cb(null, co*a*a);
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
