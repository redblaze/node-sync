# node-sync

Programming in NodeJS with callback passing style can be error prone and difficult to maintain.  In particular:

1. Functional calls can be deeply nested, resulting in <i>callback hell</i>.


2. Exceptions are not propagating with continuations.  Programmers are required to catch exceptions in each block and pass them explicitly to the callback (in the error argument position).


3. It is dangerous to handle explicit callbacks in code.  A callback function, in most intended common cases, should be invoked once and only once.  It is a huge burden for developers to maintain this invariant when coding.  If a callback is not invoked, then the program will usually halt; on the other hand, if a callback is invoked more than once (unintendedly), then the program will reach a limbo state.

4. When there is an error happening in the program, the stack information is usually not very helpful.  This is because the async callback function chaining is breaking normal stack layering, such that it can be very difficult for develop to trace, via error stacks, to where the code error really happens.

5. There lacks CLS (continuation local state, which is corresponding to thread local state in thread programming models, e.g. Java).  CLS can be critical in certain situations, such as programming with relational database transactions.  CLS can also greatly facilitate the ease of coding.

To mitigate these problem, may packages have been created, and async/await primitives are coming to ES7.  However, none of the solutions are addressing all the concerns listed above, especially 4 and 5.  The node-sync package is aiming at providing a complete solution to all the 5 listed difficulties that developers face in practical NodeJS coding.  Instead of intending to be a final solution, it more of an expectation that this package starts a line of thoughts and follow up works to make NodeJS coding as unobtrusive as possible.

## Use

```javascript
var sync = require('node-sync').sync5;
var co = sync.co;
var proc = sync.proc;
var proc = sync.proc;
var lift = sync.lift;
var $get = sync.$get;
var $let = sync.$let;
var Thread = sync.Thread;
var sleep = sync.sleep;
```

Or I usually define a <i> Macro </i>:

```javascript
var requireBundle = function(name) {
    switch(name) {
        case 'sync':
            return [
                'var sync = require("node-sync").sync5;',
                'var co = sync.co;',
                'var proc = sync.proc;',
                'var $let = sync.$let;',
                'var $get = sync.$get;',
                'var lift = sync.lift;',
                'var Thread = sync.Thread;',
                'var sleep = sync.sleep;'
            ];
        default: 
            throw new Error('requireBundle does not support: ' + name);
    }
};

module.exports = function() {
    var l = [];

    for (var i = 0; i < arguments.length; i++) {
        var bundleName = arguments[i];
        l = l.concat(requireBundle(bundleName));
    }

    return l.join('');
};

```

Such that I can simply include full package using:

```javascript
eval(require('./require_bundle')('sync'));
```

## API Documents

* Basic
    * [co](#co)
    * [proc](#proc)
    * [lift](#lift)
* CLS (continuation local state)
    * [$let](#$let)
    * [$get](#$get)
* Thread
    * [Thread.folk](#thread_folk)
    * [thread.join](#thread_join)
    * [Thread.select](#thread_select)
    * [Thread.timeout](#thread_timeout)


### Basic
<a name="co"></a>
#### co: (generator\_function) -> generator\_function

co takes a generator function as input, and output a generator function as result.  It is almost an identity function, which does not add any further semantics to the original input generator function.  What it does is to simply transform a generator function to a proxied one such that when there is an error thrown by the computation, the stack frame for the call to the current generator function can be recorded (in the Error object).  This is to defeat the problem of losing accurate stack trace in error handling.

<a name="proc"></a>
#### proc: (generator\_function) -> async\_function

proc transforms a generator function to an async function for execution.  An async function has the following type signature:

```
(arguments) -> (environment, callback) -> void
```

where callback has the following type signature:

```
(error, result) -> void
```

In words, for an async function to execute, it first applies to a list of parameters, and then takes an environment object and callback function to deliver the result.  Environment object will be further discussed later in this document, but for now, it can be understood simply as an Hashmap (e.g. key/value pairs).

<a name="lift"></a>
#### lift: (asyn\_function) -> generator\_function

lift, in a loose sense, can be considered as the opposite of proc: it transforms an async function to a generator function.  This is to fit common async functions as defined in NodeJS standard APIs into the loop of node-sync.

#### Example

Now that we know the three key functions, co, proc and lift, let's look at an example on how to put them together to write a real program.

```javascript
var _remoteAdd = function(a, b, cb) {
    setTimeout(function() {
        cb(null, a+b);
    }, 1000);
};

var add = co(function*(a, b) {
    return yield* lift(_remoteAdd)(a, b);
});

var nSum = co(function*(n){
    var res = 0;
    for (var i = 0; i < n; i++) {
        res = yield* add(res, i)
        console.log(res);
    }
    return res;
});

var main = co(function*() {
    return yield* nSum(10);
});

var cb = function(err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};

proc(main)()({}, cb);
```

In this example, we first define an async function _remoteAdd the *old school* way.  Then at line 8, we apply the lift function to lift it to a generator function, such that it become "yieldable" from within the definition of a generator function.  Note *yield\** is used to "call" a generator function from within the scope of an enclosing generator function.  It is <b>NOT</b> *yield* that we use.

The function add, as defined on line 7, is turning the async function _remoteAdd to a "synced" version.  Then the nSum function is making use of add function to compute the sum from 1 to n (with an intended delay in each step).  Note that nSum function is write completely in a normal way, where no signs of callbacks of any sort are involved, even if under the hood there is an asynced timeout function.  main function simply calls nSum function and compute the sum of all numbers from 1 through 10.  

The generator function main won't execute itself, unless we trigger its execution.  This is on line 33, where we use proc to convert main to an async function, which is then executed by taking the feed of two stages of parameters.  In this example, main is executed against an empty starting environment, and a straightforward callback function.

One thing to note about the callback function definition is err.\_\_generatorStack\_\_ as can be found on line 27.  This is an extra field we put in Error objects to record the *true* call stack of the generator functions, with all the noisy callback function chaining stack frames filtered out.  Please note it is with the use of function co that such *true* stack is available.

#### Checkpoint

With the three functions, co, proc and lift, we can fully emulate async/await in ES7.  Roughly:

```javascript
async(function() {
    //...
});
```

can be emulated with:

```javascript
co(function*() {
});
```

while

```javascript
await fn();
```

can be emulated with:

```javascript
yield* fn();
```

What is provided more in nodes-sync package, beyond async/await, is the *true* calling stack being recorded in Error objects (in the field \_\_generatorStack\_\_).  To our experience of real world practice, this is crucial in program debugging as well as understanding error messages in logs, especially where there is a production issue.

If you are simply looking for an ES6 emulation of async/await before ES7 is generally available all over the places, this is it!  The three functions, co, proc and lift will do all the trick (and moreover with the *true* stack).  For the rest of this document, we will further discuss advanced feature:

* CLS (continuation local state)
* parallelism and thread emulation

### CLS (continuation local state)

CLS is parallel to thread local state in Java.  It is inevitably useful for certain patterns of programming.  node-sync provides a clean built-in solution of CLS, without any hacky approaches such as messing up with the runtime environment event loop, or tweaky polyfilling.

<a name="$get"></a>
#### $get: (variable\_name) -> value

Within the scope of a generator function, $get can be called to retrieve a value stored in CLS.

<a name="$let"></a>
#### $let: (environment, generator\_function) -> generator\_function 

Within an enclosing scope of generator function, $let can be called to put another generator function into another level of nested CLS to execute.


#### Example

Let's look at examples to illustrate the use of CLS.  Let develop this example step by step, starting from the basic one:

```javascript
var cb = function(err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};

var square = co(function*(a) {
    var res = yield* lift(function(cb) {
        setTimeout(function() {
            cb(null, a * a);
        }, 1000);
    })();

    return res;
});

var remoteAdd = co(function*(a, b) {
    var a2 = yield* square(a);
    var b2 = yield* square(b);
    return a2 + b2;
});

var main = co(function*() {
    var res = yield* remoteAdd(1, 2);
    return res;
});

proc(main)()({}, cb);
```

In this program, we simply compute ```1*1 + 2*2``` (in a intended twisted way, of course).  Now what want *enhance* this program by adding a bit flavor to the function square.  We want to add a coefficient factor to its result, where this coefficient is really retrieved from the *environment*.

```javascript
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
    
    var res = yield* lift(function(cb) {
        setTimeout(function() {
            cb(null, coeff * a * a);
        }, 1000);
    })();

    return res;
});

var remoteAdd = co(function*(a, b) {
    var a2 = yield* $let({coeff: 3}, square)(a);
    var b2 = yield* square(b);
    return a2 + b2;
});

var main = co(function*() {
    var e = {coeff: 5};
    var res = yield* $let(e, remoteAdd) (1, 2);
    return res;
});

proc(main)()({}, cb);
```

This becomes a bit more interesting.  In the computation of square, we take a coefficient factor into consideration.  Its value is being obtained from calling ```$get``` on line 11.  This value is used to compute the result of square on line 15.  The coefficient value is *not* passed in as a parameter to the square function.  Instead, it's being stored in an environment, or say, CLS.  So the question is, where is the value assigned?  There are two places in this program that the coefficient value is assigned, on line 30 and on line 23.  Line 30 binds a value 5 to the key ```coeff```, which will be used in the computation of calling ```remoteAdd``` on ```(1, 2)```.  Then in ```remoteAdd```, on line 23, when computing the value of ```a2```, the value of ```coeff``` is rebound to 3, which only take effects in computing ```a2``` by applying ```square``` on ```(a)```.  So the actual math being carried out is ```3*1*1 + 5*2*2```, which gives the result ```23``` eventually.

So ```$let``` function is used to bind a value to a key in the environment, and use this environment as the scope for a given computation; while ```$get``` is used to retrieve a value from the environment for a given key.  Any time in the computation, the environment can be extended to rescope a subcomputation, as show on line 23 of this example.

There seems to be some limitations to such kind of CLS, i.e. it is more of a scoped environment rather than a state that is passed all the way through the chain of continuations.  No problem, this can be recovered, as exemplified by the following:

```javascript
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
```

To have a pass through state that belongs to the current chain of computation, we simply need to defined a key ```__state__``` in the outmost enclosing environment.  Functions such as ```read``` and ```write``` are defined to operate on this particular piece of state, which is always available in the environment.  The example above shows how to count the number of calls to ```square``` throughout the program execution.  Relevant lines that manipulate the states are 46, 38, 41, 23 and 33.


### Thread

<a name="thread_folk"></a>
#### Thread.folk

<a name="thread_join"></a>
#### thread.join

<a name="thread_select"></a>
#### Thread.select

<a name="thread_timeout"></a>
#### Thread.timeout




