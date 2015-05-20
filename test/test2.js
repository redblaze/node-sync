
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
	console.log(yield getScope);
		
	return yield(function(env, cb) {
	// throw new Error('foobar');
		setTimeout(function() {
			var co = env['co'] || 1;
			console.log('compute square: ', co*a*a);
			cb(null, co*a*a);
		}, 1000);
	});
});

var getScope = function(env, cb) {
	cb(null, env);
};

var letScope = function(ext, proc) {
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
		var a2 = yield letScope({co: 3}, square(a));

		var b2 = yield square(b);
		
		return a2 + b2;
	} catch(e) {
		throw e;
		return 100;
	}
});

remoteAdd(1, 2)({co: 5}, cb);
