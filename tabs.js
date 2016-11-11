var TabSwipeLayoutGroupModule = (function(p) {

    var LOGGING = false,
    _events = {},
    dimensions = 
        ["paddingLeft", 
        "paddingRight", 
        "paddingTop", 
        "paddingBottom", 
        "marginLeft", 
        "marginRight", 
        "marginTop", 
        "marginBottom", 
        "borderLeftWidth", 
        "borderRightWidth", 
        "borderTopWidth", 
        "borderBottomWidth"],
    dimensionsLen = dimensions.length,
    isBorderCheck = false,
    isBoxSizeOuter = false,

    _isValidListener = function (listener) {
        if (typeof listener === 'function' || listener instanceof RegExp) {
            return !0;
        } else if (listener && typeof listener === 'object') {
            return _isValidListener(listener.listener);
        } else {
            return false;
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
            return !0;
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
    },

    _getStyleSize = function(value) {
        var num = parseFloat(value);
        // not a percent like '100%', and a number
        var isValid = value.indexOf("%") == -1 && !isNaN(num);
        return isValid && num;
    },

    _checkForBorder = function(){
        // setup once
        if (isBorderCheck) {
            return;
        }
        isBorderCheck = true;
        // -------------------------- box sizing -------------------------- //
        /**
         * WebKit measures the outer-width on style.width on border-box elems
         * IE & Firefox<29 measures the inner-width
         */
        var div = document.createElement("div");
        div.style.width = "400px";
        div.style.padding = "1px 2px 3px 4px";
        div.style.borderStyle = "solid";
        div.style.borderWidth = "1px 2px 3px 4px";
        div.style.boxSizing = "border-box";
        var body = document.body || document.documentElement;
        body.appendChild(div);
        var style = window.getComputedStyle(div);
        isBoxSizeOuter = _getStyleSize(style.width) == 400;
        body.removeChild(div);
    },

     _getZeroSize = function() {        
        var sizeObj = {
            width: 0,
            height: 0,
            innerWidth: 0,
            innerHeight: 0,
            outerWidth: 0,
            outerHeight: 0
        };
        for (var i = 0; i < dimensionsLen; i++) {
            var dimension = dimensions[i];
            sizeObj[dimension] = 0;
        }
        return sizeObj;
    },

    _getSize =  function(elem) {
        _checkForBorder();
        if (typeof elem == "string") {
            elem = document.querySelector(elem);
        }
        if (!elem || typeof elem != "object" || !elem.nodeType) {
            return;
        }
        var style = window.getComputedStyle(elem);
        
        if (style.display == "none") {
            return _getZeroSize();
        }
        var sizeObj = {};
        sizeObj.width = elem.offsetWidth;
        sizeObj.height = elem.offsetHeight;
        var isBorderBox = sizeObj.isBorderBox = style.boxSizing == "border-box";
        for (var i = 0; i < dimensionsLen; i++) {
            var dimension = dimensions[i];
            var value = style[dimension];
            var num = parseFloat(value);
            // any 'auto', 'medium' value will be 0
            sizeObj[dimension] = !isNaN(num) ? num : 0;
        }
        var paddingWidth = sizeObj.paddingLeft + sizeObj.paddingRight;
        var paddingHeight = sizeObj.paddingTop + sizeObj.paddingBottom;
        var marginWidth = sizeObj.marginLeft + sizeObj.marginRight;
        var marginHeight = sizeObj.marginTop + sizeObj.marginBottom;
        var borderWidth = sizeObj.borderLeftWidth + sizeObj.borderRightWidth;
        var borderHeight = sizeObj.borderTopWidth + sizeObj.borderBottomWidth;
        var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;
        // overwrite width and height if we can get it from style
        var styleWidth = getStyleSize(style.width);
        if (styleWidth !== false) {
            sizeObj.width = styleWidth + ( // add padding and border unless it's already including it
                isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
        }
        var styleHeight = getStyleSize(style.height);
        if (styleHeight !== false) {
            sizeObj.height = styleHeight + ( // add padding and border unless it's already including it
                isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
        }
        sizeObj.innerWidth = sizeObj.width - (paddingWidth + borderWidth);
        sizeObj.innerHeight = sizeObj.height - (paddingHeight + borderHeight);
        sizeObj.outerWidth = sizeObj.width + marginWidth;
        sizeObj.outerHeight = sizeObj.height + marginHeight;
        return sizeObj;
    }


})();