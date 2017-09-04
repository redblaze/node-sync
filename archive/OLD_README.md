## Description

We call a function of the following signature a procedure:

```js
function(arg1, arg2, ..., cb)
```

A procedure takes a list of arguments, where the last one is always a callback.

We call a generator that only yields procedures a procedural generator.  Then this package provides a combinator function that turns a procedural generator of the following signature:

```js
function*(arg1, arg2, ...,)
```

into a procedure of the following signature:

```js
function(arg1, arg2, ..., cb)
```

This provides a way to compose procedural generators to build larger procedural generators in a simple way.  See [examples](#examples).


## Note

This only work with NodeJS 0.11.*, which has support to generators.  You need to run node with the option "--harmony" in order to use generators.

## Install

```text
npm install node-sync
```

## Use

```js
var proc = requrire('node-sync');
```

<a name="examples"/>
## Example

```js
Error.stackTraceLimit = Infinity;

var proc = require('node-sync').proc;

var cb = function(err, res) {
    if (err) {
        console.log('cb ERROR', err.stack);
        console.log(err.__generatorStack__);
    } else {
        console.log('OK', res);
    }
};


var remoteAdd = proc(function*(a, b) {
    try {
        var c = yield function(cb) {
            setTimeout(
                function() {
                    if (b == 5) {
                        cb (new Error('foobar'));
                    } else {
                        cb(null, a + b);
                    }
                },
                1000
            );
        };
        return c;
    } catch(e) {
        console.log('catch error in remoteAdd');
        throw e;
        // return a + b;
    }
});

var remoteSum = proc(function*(n) {
    try {
        var res = 0;

        for (i = 0; i < n; i++) {
            res = yield remoteAdd(res, i);
            console.log(res);
        }

        return res;
    } catch(e) {
        // console.log(e);
        throw e;
        // return 'swallow error in remoteSum';
    }
});

var main = proc(function*() {
    try {
        var res = yield remoteSum(10);
        console.log('success in main');
        return res;
    } catch(e) {
        console.log('catch err in main');
        throw(e);
    }
});

main()(cb);
```