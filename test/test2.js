
Error.stackTraceLimit = Infinity;

var proc = require('../lib/sync2');

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

var implicit = function(k) {
	return function (env, cb) {
		cb(null, env[k]);
	};
};

var letImplicit = function(ext, proc) {
	return function(env, cb) {
		proc(extScope(env, ext), cb);
	};	
};

var extScope = function(env, ext) {
	var res = {};
	for (var k in env) {
		res[k] = env[k];
	}
	for (var k in ext) {
		res[k] = ext[k];
	}
	return res;
};

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
