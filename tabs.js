var TabSwipeLayoutGroupModule = (function(p) {

    var LOGGING = false,
    _events = {};

    _isValidListener = function (listener) {
        if (typeof listener === 'function' || listener instanceof RegExp) {
            return !0;
        } else if (listener && typeof listener === 'object') {
            return _isValidListener(listener.listener);
        } else {
            return false
        }
    },

    _getEvents = function() {
        return _events;
    };

    _getListenersArray = function(evt) {
        var listeners = _getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    _getListeners = function(evt) {
        var events = _getEvents();
        var response;
        var key;

        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    _addListener = function(evt, listener) {
        if (!_isValidListener(listener)) {
            if (LOGGING) console.log("Not valid listener passed");
            return false;
        }

        var listeners = _getListenersArray(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    },

    _addOnceListener = function(evt, listener) {
        return _addListener(evt, {
            listener: listener,
            once: true
        });
    },


    _emitEvent = function(evt, args) {
        var listenersMap = _getListenersArray(evt),listeners,listener,i,key;
        var response;

        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);

                for (i = 0; i < listeners.length; i++) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[i];

                    if (listener.once === true) {
                        _removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        _removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    },

    _getOnceReturnValue = function() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    _removeListener = function(evt, listener) {
        var listeners = _getListenersArray(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = _indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    },

    _indexOfListener = function(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }


})();