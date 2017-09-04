
/* How to use implicit parameters */

var sync = require('../lib/main').sync5;
var co = sync.co;
var proc = sync.proc;
var $let = sync.$let;
var $get = sync.$get;
var lift = sync.lift;


var read = co(function*(k) {
    var state = yield* $get('__state__');
    return state[k];
});

var write = co(function*(k, v) {
    var state = yield* $get('__state__');
    state[k] = v;
});


var cb = function(err, res) {
	if (err) {
		console.log('cb ERROR', err.stack);
		console.log(err.__generatorStack__);
	} else {
		console.log('OK', res);
	}
};

var square = co(function*(a) {
	var coeff = yield* $get('coeff') || 1;
	var count = yield* read('mult_count');

	if (count == null) {count = 0;};

	var res = yield* lift(function(cb) {
		setTimeout(function() {
			cb(null, coeff * a * a);
		}, 1000);
	})();

	yield* write('mult_count', count + 1);
	return res;
});

var remoteAdd = co(function*(a, b) {
	yield* write('mult_count', 0);
	var a2 = yield* $let({coeff: 3}, square)(a);
	var b2 = yield* square(b);
	console.log('There are', yield* read('mult_count'), 'square operation(s) conducted.');
	return a2 + b2;
});

var main = co(function*() {
	var e = {coeff: 5, __state__: {}};
	var res = yield* $let(e, remoteAdd) (1, 2);	
	return res;

});

proc(main)()({}, cb);
