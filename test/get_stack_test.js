
var f = function() {
	g();
};

var g = function() {
	// var stack = getStack(arguments.callee);
	var stack = getStack();
	console.log(stack);
};

var getStack = function(cap) {
	cap = cap || arguments.callee;
	var save = Error.stackTraceLimit;
	Error.stackTraceLimit = 1;
	var o = {};
	Error.captureStackTrace(o, cap);
	Error.stackTraceLimit = save;
	return o.stack;
};

f();