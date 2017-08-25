var Tail = require('./tail');

var safeGuard = function(m) {
    var me = this;
    return function(e, s, cb) {
        try {
            m.call(me, e, s, cb);
        } catch(err) {
            cb(s, err);
        }
    };
};


var parallel2 = function(m1, m2) {
    return function(e, s, cb) {
        var state1 = 'start';
        var state2 = 'start';
        var res1;
        var res2;
        var err1;
        var err2;

        var cb1 = function(s, err, res) {Tail.run(function() {
            if (err) {
                state1 = 'error';
                err1 = err;
                switch(state2) {
                    case 'start':
                        break;
                    case 'done':
                        cb(s, null, [
                            {status: 'error', error: err1},
                            {status: 'ok', data: res2}
                        ]);
                        break;
                    case 'error':
                        cb(s, null, [
                            {status: 'error', error: err1},
                            {status: 'error', error: err2}
                        ]);
                        break;
                    default:
                }
            } else {
                state1 = 'done';
                res1 = res;
                switch(state2) {
                    case 'start':
                        break;
                    case 'done':
                        cb(s, null, [
                            {status: 'ok', data: res1},
                            {status: 'ok', data: res2}
                        ]);
                        break;
                    case 'error':
                        cb(s, null, [
                            {status: 'ok', data: res1},
                            {status: 'error', error: err2}
                        ]);
                        break;
                    default:
                }
            }
        })};

        var cb2 = function(s, err, res) {Tail.run(function() {
            if (err) {
                state2 = 'error';
                err2 = err;
                switch(state1) {
                    case 'start':
                        break;
                    case 'done':
                        cb(s, null, [
                            {status: 'ok', data: res1},
                            {status: 'error', error: err2}
                        ]);
                        break;
                    case 'error':
                        cb(s, null, [
                            {status: 'error', error: err1},
                            {status: 'error', error: err2}
                        ]);
                        break;
                    default:
                }
            } else {
                state2 = 'done';
                res2 = res;
                switch(state1) {
                    case 'start':
                        break;
                    case 'done':
                        cb(s, null, [
                            {status: 'ok', data: res1},
                            {status: 'ok', data: res2}
                        ]);
                        break;
                    case 'error':
                        cb(s, null, [
                            {status: 'error', error: err1},
                            {status: 'ok', data: res2}
                        ]);
                        break;
                    default:
                }
            }
        })};

        safeGuard(m1)(e, s, cb1);
        safeGuard(m2)(e, s, cb2);
    };
};

var _parallel = function(ms, i) {
    if (ms.length == 0) {
        return function(e, s, cb) {
            cb(s);
        };
    }

    var m = ms[i];

    if (i == ms.length - 1) {
        return function(e, s, cb) {
            m(e, s, function(s, err, res) {
                if (err) {
                    cb(s, null, [{status: 'error', error: err}]);
                } else {
                    cb(s, null, [{status: 'ok', data: res}]);
                }
            });
        }
    }
    return function(e, s, cb) {
        parallel2(m, _parallel(ms, i+1))(e, s, function(s, err, res) {
            cb(s, null, [res[0]].concat(res[1].data));
        });
    };
};

var parallel = function(ms) {
    return _parallel(ms, 0);
};

module.exports = parallel;

