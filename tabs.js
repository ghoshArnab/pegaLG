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
    touchStart = 'touchstart',
    mouseDown  = 'mousedown',
    pointerIdentifier = "",
    isPointerDown = false,
    postStartEvents = {
        mousedown: ["mousemove", "mouseup"],
        touchstart: ["touchmove", "touchend", "touchcancel"],
        pointerdown: ["pointermove", "pointerup", "pointercancel"],
        MSPointerDown: ["MSPointerMove", "MSPointerUp", "MSPointerCancel"]
    },
    boundPointerEvents = "",

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
        var listenersMap = _getListenersArray(evt);
        var listeners,listener,i,key,response;

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
        var styleWidth = _getStyleSize(style.width);
        if (styleWidth !== false) {
            sizeObj.width = styleWidth + ( // add padding and border unless it's already including it
                isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
        }
        var styleHeight = _getStyleSize(style.height);
        if (styleHeight !== false) {
            sizeObj.height = styleHeight + ( // add padding and border unless it's already including it
                isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
        }
        sizeObj.innerWidth = sizeObj.width - (paddingWidth + borderWidth);
        sizeObj.innerHeight = sizeObj.height - (paddingHeight + borderHeight);
        sizeObj.outerWidth = sizeObj.width + marginWidth;
        sizeObj.outerHeight = sizeObj.height + marginHeight;
        return sizeObj;
    },

    _extend = function (targetObj, sourceObj) {
        for (var prop in sourceObj) {
            targetObj[prop] = sourceObj[prop];
        }
        return targetObj;
    },

    _createArray = function (obj) {
        var ary = [];
        if (obj && typeof obj.length == "number") {
            // convert nodeList to array
            for (var i = 0; i < obj.length; i++) {
                ary.push(obj[i]);
            }
        } else {
            // array of single index
            ary.push(obj);
        }
        return ary;
    },

    _getQuerySelector = function (elem) {
        if (typeof elem == "string") {
            return document.querySelector(elem);
        }
        return elem;
    },

    _createElementsArray = function (elems, selector) {
        elems = _createArray(elems);
        var elemsArray = [];
        elems.forEach(function (elem) {
            if (!(elem instanceof HTMLElement)) {
                return;
            }            
            if (!selector) {
                elemsArray.push(elem);
                return;
            }
            elemsArray.push(elem);
            var childElems = elem.querySelectorAll(selector);
            for (var i = 0; i < childElems.length; i++) {
                elemsArray.push(childElems[i]);
            }
        });
        return elemsArray;
    },

    //TODO : NEED TO WRITE THIS - NIKHIL
    _htmlInit = function(WidgetClass, namespace) {
        document.addEventListener("DOMContentLoaded", function () {
            //var dashedNamespace = utils.toDashed(namespace);
            var dataAttr = "data-" + namespace;
            var dataAttrElems = document.querySelectorAll("[" + dataAttr + "]");
            var jsDashElems = document.querySelectorAll(".js-" + namespace);
            var elems = _createArray(dataAttrElems).concat(_createArray(jsDashElems));
            var dataOptionsAttr = dataAttr + "-options";
            var jQuery = window.jQuery;
            elems.forEach(function (elem) {
                var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
                var options;
                options = attr && JSON.parse(attr);
                // initialize
                var instance = new WidgetClass(elem, options);
                // make available via $().data('namespace')
                if (jQuery) {
                    jQuery.data(elem, namespace, instance);
                }
            });
        });
    },

    _bindEvent = function(elem){
        elem["addEventListener"](mouseDown, this);
        elem["addEventListener"](touchStart, this);
    },

    _unbindEvent = function(elem){
        elem["removeEventListener"](mouseDown, this);
        elem["removeEventListener"](touchStart, this);
    },

    _getTouch = function(touches) {
        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            if (touch.identifier == pointerIdentifier) {
                return touch;
            }
        }
    },

    _onMouseDown = function (event) {
        if (event && event.button && (event.button !== 0 && event.button !== 1)) {
            return;
        }
        this._pointerDown(event, event);
    },

    _pointerDown = function (event, pointer) {
        // dismiss other pointers
        if (isPointerDown) {
            return;
        }
        isPointerDown = true;
        // save pointer identifier to match up touch events
        pointerIdentifier = pointer.pointerId !== undefined ? // pointerId for pointer events, touch.indentifier for touch events
            pointer.pointerId : pointer.identifier;
        _eventFirePointerDown(event, pointer);
    },

    _eventFirePointerDown = function (event, pointer) {
        _bindPostStartEvents(event);
        _emitEvent("pointerDown", [event, pointer]);
    },

    _bindPostStartEvents = function (event) {
        if (!event) {
            return;
        }
        // get proper events to match start event
        var events = postStartEvents[event.type];
        // bind events to node
        events.forEach(function (eventName) {
            window.addEventListener(eventName, this);
        }, this);
        // save these arguments
        boundPointerEvents = events;
    },

    _unbindPostStartEvents = function () {
        // check for _boundEvents, in case dragEnd triggered twice (old IE8 bug)
        if (!_boundPointerEvents) {
            return;
        }
        _boundPointerEvents.forEach(function (eventName) {
            window.removeEventListener(eventName, this);
        }, this);
        _boundPointerEvents = "";
    }, 

    _onTouchStart = function (event) {
        _pointerDown(event, event.changedTouches[0]);
    },

    onMSPointerDown = function (event) {
        _pointerDown(event, event);
    },

    _onMouseMove = function (event) {
        _pointerMove(event, event);
    },

    _onMSPointerMove = function (event) {
        if (event.pointerId == pointerIdentifier) {
            _pointerMove(event, event);
        }
    },
    
    _onTouchMove = function (event) {
        var touch = _getTouch(event.changedTouches);
        if (touch) {
            _pointerMove(event, touch);
        }
    },

    _pointerMove = function (event, pointer) {
        _eventFirePointerMove(event, pointer);
    },

    _eventFirePointerMove = function (event, pointer) {
        _emitEvent("pointerMove", [event, pointer]);
    },

    _onMouseUp = function (event) {
        _pointerUp(event, event);
    },

    _onMSPointerUp = function (event) {
        if (event.pointerId == pointerIdentifier) {
            _pointerUp(event, event);
        }
    },
    
    _onToucheEnd = function (event) {
        var touch = _getTouch(event.changedTouches);
        if (touch) {
            _pointerUp(event, touch);
        }
    },

    _pointerUp = function (event, pointer) {
        _pointerDone();
        _eventFirePointerUp(event, pointer);
    },

    _eventFirePointerUp = function (event, pointer) {
        _emitEvent("pointerUp", [event, pointer]);
    },

    _pointerDone = function () {
        // reset properties
        isPointerDown = false;
        pointerIdentifier = "";
        // remove events
        _unbindPostStartEvents();
        
    },

    _onMSPointerCancel = function (event) {
        if (event.pointerId == this.pointerIdentifier) {
            this._pointerCancel(event, event);
        }
    },

    _onTouchCancel = function (event) {
        var touch = _getTouch(event.changedTouches);
        if (touch) {
            _pointerCancel(event, touch);
        }
    },
    
    _pointerCancel = function (event, pointer) {
        _pointerDone();
        _eventFirePointerCancel(event, pointer);
    },

    _eventFirePointerCancel = function (event, pointer) {
        _emitEvent("pointerCancel", [event, pointer]);
    },

    _getPointerCordinates = function (pointer) {
        return {
            x: pointer.pageX,
            y: pointer.pageY
        };
    },


})();