var Closure = function(gfn) {
    this._gfn = gfn;

    this._env = {};

    this._onRes = function(res) {

    };

    this._onErr = function(err) {
        console.log('ERROR: ', err);
        if (err.stack) {
            console.log('stack: ', err.stack);
        }
        if (err.__generatorStack__) {
            console.log('generator stack: ', err.__generatorStack__);
        }
    }
};

Closure.prototype = {
    apply: function(subject, args) {
        var me = this;

        me._gfn.apply(subject, args)(me._env, function(err, res) {
            if (err) {
                me._onErr(err);
            } else {
                me._onRes(res);
            }
        });
    },

    call: function() {
        var me = this;

        var subject = arguments[0];
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        me.apply(subject, args);
    },

    run: function() {
        this.apply(null, arguments);
    },

    inEnv: function(env) {
        this._env = env;
        return this;
    },

    success: function(fn) {
        this._onRes = fn;
        return this;
    },

    fail: function(fn) {
        this._onErr = fn;
        return this;
    }
};

module.exports = function(gfn) {
    return new Closure(gfn);
};

/*
clo(fn).run();

clo(fn).fail(function(err) {

}).run();
*/

