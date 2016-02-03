exports.logger = utillogger = {
    debug: false,
    setup: function(options) {
        if (options && options.debug) {
            return utillogger.debug = true;
        }
    },
    start: function() {
        return this._tick = new Date();
    },
    stop: function() {
        return (new Date().getTime() - this._tick.getTime()) + 'ms';
    },
    trace: function() {
        if (!utillogger.debug) {
            return;
        }
        return utillogger.to("[TRACE] ", Array.prototype.join.call(arguments, " "));
    },
    error: function() {
        return utillogger.to("[ERROR] ", Array.prototype.join.call(arguments, " "));
    },
    log: function() {
        return utillogger.to("[LOG] ", Array.prototype.join.call(arguments, " "));
    },
    to: function() {
        var n;
        n = Array.prototype.join.call(arguments, "");
        return console.info(n);
    }
};
