/*!
 * Flickity PACKAGED v2.0.5
 * Touch, responsive, flickable carousels
 *
 * Licensed GPLv3 for open source use
 * or Flickity Commercial License for commercial use
 *
 * http://flickity.metafizzy.co
 * Copyright 2016 Metafizzy
 */
/**
 * EvEmitter v1.0.3
 * Lil' event emitter
 * MIT License
 */
/* jshint unused: true, undef: true, strict: true */
window.EvEmitter = function() {
    var proto = EvEmitter.prototype;
    return proto.on = function(eventName, listener) {
        if (eventName && listener) {
            // set events hash
            var events = this._events = this._events || {}, listeners = events[eventName] = events[eventName] || [];
            // only add once
            return -1 == listeners.indexOf(listener) && listeners.push(listener), this;
        }
    }, proto.once = function(eventName, listener) {
        if (eventName && listener) {
            // add event
            this.on(eventName, listener);
            // set once flag
            // set onceEvents hash
            var onceEvents = this._onceEvents = this._onceEvents || {}, onceListeners = onceEvents[eventName] = onceEvents[eventName] || {};
            // set flag
            return onceListeners[listener] = !0, this;
        }
    }, proto.off = function(eventName, listener) {
        var listeners = this._events && this._events[eventName];
        if (listeners && listeners.length) {
            var index = listeners.indexOf(listener);
            return -1 != index && listeners.splice(index, 1), this;
        }
    }, proto.emitEvent = function(eventName, args) {
        var listeners = this._events && this._events[eventName];
        if (listeners && listeners.length) {
            var i = 0, listener = listeners[i];
            args = args || [];
            for (// once stuff
            var onceListeners = this._onceEvents && this._onceEvents[eventName]; listener; ) {
                var isOnce = onceListeners && onceListeners[listener];
                isOnce && (// remove listener
                // remove before trigger to prevent recursion
                this.off(eventName, listener), // unset once flag
                delete onceListeners[listener]), // trigger listener
                listener.apply(this, args), // get next listener
                i += isOnce ? 0 : 1, listener = listeners[i];
            }
            return this;
        }
    }, EvEmitter;
}, window.EvEmitter(), /*!
 * getSize v2.0.2
 * measure size of elements
 * MIT license
 */
/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false, console: false */
function(window, factory) {
    "use strict";
    "function" == typeof define && define.amd ? // AMD
    define("get-size/get-size", [], function() {
        return factory();
    }) : "object" == typeof module && module.exports ? module.exports = factory() : window.getSize = factory();
}(window, function() {
    "use strict";
    // -------------------------- helpers -------------------------- //
    // get a number from a string, not a percentage
    function getStyleSize(value) {
        var num = parseFloat(value), isValid = -1 == value.indexOf("%") && !isNaN(num);
        return isValid && num;
    }
    function noop() {}
    function getZeroSize() {
        for (var size = {
            width: 0,
            height: 0,
            innerWidth: 0,
            innerHeight: 0,
            outerWidth: 0,
            outerHeight: 0
        }, i = 0; measurementsLength > i; i++) {
            var measurement = measurements[i];
            size[measurement] = 0;
        }
        return size;
    }
    // -------------------------- getStyle -------------------------- //
    /**
     * getStyle, get style of element, check for Firefox bug
     * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
     */
    function getStyle(elem) {
        var style = getComputedStyle(elem);
        return style || logError("Style returned " + style + ". Are you running this code in a hidden iframe on Firefox? See http://bit.ly/getsizebug1"), 
        style;
    }
    /**
     * setup
     * check isBoxSizerOuter
     * do on first getSize() rather than on page load for Firefox bug
     */
    function setup() {
        // setup once
        if (!isSetup) {
            isSetup = !0;
            // -------------------------- box sizing -------------------------- //
            /**
         * WebKit measures the outer-width on style.width on border-box elems
         * IE & Firefox<29 measures the inner-width
         */
            var div = document.createElement("div");
            div.style.width = "200px", div.style.padding = "1px 2px 3px 4px", div.style.borderStyle = "solid", 
            div.style.borderWidth = "1px 2px 3px 4px", div.style.boxSizing = "border-box";
            var body = document.body || document.documentElement;
            body.appendChild(div);
            var style = getStyle(div);
            getSize.isBoxSizeOuter = isBoxSizeOuter = 200 == getStyleSize(style.width), body.removeChild(div);
        }
    }
    // -------------------------- getSize -------------------------- //
    function getSize(elem) {
        // do not proceed on non-objects
        if (setup(), // use querySeletor if elem is string
        "string" == typeof elem && (elem = document.querySelector(elem)), elem && "object" == typeof elem && elem.nodeType) {
            var style = getStyle(elem);
            // if hidden, everything is 0
            if ("none" == style.display) return getZeroSize();
            var size = {};
            size.width = elem.offsetWidth, size.height = elem.offsetHeight;
            // get all measurements
            for (var isBorderBox = size.isBorderBox = "border-box" == style.boxSizing, i = 0; measurementsLength > i; i++) {
                var measurement = measurements[i], value = style[measurement], num = parseFloat(value);
                // any 'auto', 'medium' value will be 0
                size[measurement] = isNaN(num) ? 0 : num;
            }
            var paddingWidth = size.paddingLeft + size.paddingRight, paddingHeight = size.paddingTop + size.paddingBottom, marginWidth = size.marginLeft + size.marginRight, marginHeight = size.marginTop + size.marginBottom, borderWidth = size.borderLeftWidth + size.borderRightWidth, borderHeight = size.borderTopWidth + size.borderBottomWidth, isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter, styleWidth = getStyleSize(style.width);
            styleWidth !== !1 && (size.width = styleWidth + (// add padding and border unless it's already including it
            isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth));
            var styleHeight = getStyleSize(style.height);
            // add padding and border unless it's already including it
            return styleHeight !== !1 && (size.height = styleHeight + (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight)), 
            size.innerWidth = size.width - (paddingWidth + borderWidth), size.innerHeight = size.height - (paddingHeight + borderHeight), 
            size.outerWidth = size.width + marginWidth, size.outerHeight = size.height + marginHeight, 
            size;
        }
    }
    var isBoxSizeOuter, logError = "undefined" == typeof console ? noop : function(message) {
        console.error(message);
    }, measurements = [ "paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "marginLeft", "marginRight", "marginTop", "marginBottom", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth" ], measurementsLength = measurements.length, isSetup = !1;
    return getSize;
}), /**
 * matchesSelector v2.0.1
 * matchesSelector( element, '.selector' )
 * MIT license
 */
window.matchesSelector = function() {
    "use strict";
    var matchesMethod = function() {
        var ElemProto = Element.prototype;
        // check for the standard method name first
        if (ElemProto.matches) return "matches";
        // check un-prefixed
        if (ElemProto.matchesSelector) return "matchesSelector";
        for (var prefixes = [ "webkit", "moz", "ms", "o" ], i = 0; i < prefixes.length; i++) {
            var prefix = prefixes[i], method = prefix + "MatchesSelector";
            if (ElemProto[method]) return method;
        }
    }();
    return function(elem, selector) {
        return elem[matchesMethod](selector);
    };
}, window.matchesSelector(), /**
 * Fizzy UI utils v2.0.3
 * MIT license
 */
/*jshint browser: true, undef: true, unused: true, strict: true */
function(window, factory) {
    // universal module definition
    /*jshint strict: false */
    /*globals define, module, require */
    "function" == typeof define && define.amd ? // AMD
    define("fizzy-ui-utils/utils", [ "desandro-matches-selector/matches-selector" ], function(matchesSelector) {
        return factory(window, matchesSelector);
    }) : "object" == typeof module && module.exports ? module.exports = factory(window, require("desandro-matches-selector")) : window.fizzyUIUtils = factory(window, window.matchesSelector);
}(window, function(window, matchesSelector) {
    var utils = {};
    // -----  ----- //
    // ----- extend ----- //
    // extends objects
    // ----- modulo ----- //
    // ----- makeArray ----- //
    // turn element or nodeList into an array
    // ----- removeFrom ----- //
    // ----- getParent ----- //
    // ----- getQueryElement ----- //
    // use element as selector string
    // ----- handleEvent ----- //
    // enable .ontype to trigger from .addEventListener( elem, 'type' )
    // ----- filterFindElements ----- //
    // ----- debounceMethod ----- //
    // ----- docReady ----- //
    // ----- htmlInit ----- //
    /**
     * allow user to initialize classes via [data-namespace] or .js-namespace class
     * htmlInit( Widget, 'widgetName' )
     * options are parsed from data-namespace-options
     */
    return utils.extend = function(a, b) {
        for (var prop in b) a[prop] = b[prop];
        return a;
    }, utils.modulo = function(num, div) {
        return (num % div + div) % div;
    }, utils.makeArray = function(obj) {
        var ary = [];
        if (Array.isArray(obj)) // use object if already an array
        ary = obj; else if (obj && "number" == typeof obj.length) // convert nodeList to array
        for (var i = 0; i < obj.length; i++) ary.push(obj[i]); else // array of single index
        ary.push(obj);
        return ary;
    }, utils.removeFrom = function(ary, obj) {
        var index = ary.indexOf(obj);
        -1 != index && ary.splice(index, 1);
    }, utils.getParent = function(elem, selector) {
        for (;elem != document.body; ) if (elem = elem.parentNode, matchesSelector(elem, selector)) return elem;
    }, utils.getQueryElement = function(elem) {
        return "string" == typeof elem ? document.querySelector(elem) : elem;
    }, utils.handleEvent = function(event) {
        var method = "on" + event.type;
        this[method] && this[method](event);
    }, utils.filterFindElements = function(elems, selector) {
        // make array of elems
        elems = utils.makeArray(elems);
        var ffElems = [];
        return elems.forEach(function(elem) {
            // check that elem is an actual element
            if (elem instanceof HTMLElement) {
                // add elem if no selector
                if (!selector) return void ffElems.push(elem);
                // filter & find items if we have a selector
                // filter
                matchesSelector(elem, selector) && ffElems.push(elem);
                // concat childElems to filterFound array
                for (var childElems = elem.querySelectorAll(selector), i = 0; i < childElems.length; i++) ffElems.push(childElems[i]);
            }
        }), ffElems;
    }, utils.debounceMethod = function(_class, methodName, threshold) {
        // original method
        var method = _class.prototype[methodName], timeoutName = methodName + "Timeout";
        _class.prototype[methodName] = function() {
            var timeout = this[timeoutName];
            timeout && clearTimeout(timeout);
            var args = arguments, _this = this;
            this[timeoutName] = setTimeout(function() {
                method.apply(_this, args), delete _this[timeoutName];
            }, threshold || 100);
        };
    }, utils.docReady = function(callback) {
        var readyState = document.readyState;
        "complete" == readyState || "interactive" == readyState ? // do async to allow for other scripts to run. metafizzy/flickity#441
        setTimeout(callback) : document.addEventListener("DOMContentLoaded", callback);
    }, utils.htmlInit = function(WidgetClass, namespace) {
        utils.docReady(function() {
            //var dashedNamespace = utils.toDashed(namespace);
            var dataAttr = "data-" + namespace, dataAttrElems = document.querySelectorAll("[" + dataAttr + "]"), jsDashElems = document.querySelectorAll(".js-" + namespace), elems = utils.makeArray(dataAttrElems).concat(utils.makeArray(jsDashElems)), dataOptionsAttr = dataAttr + "-options", jQuery = window.jQuery;
            elems.forEach(function(elem) {
                var options, attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
                try {
                    options = attr && JSON.parse(attr);
                } catch (error) {
                    // log error, do not initialize
                    return void (console && console.error("Error parsing " + dataAttr + " on " + elem.className + ": " + error));
                }
                // initialize
                var instance = new WidgetClass(elem, options);
                // make available via $().data('namespace')
                jQuery && jQuery.data(elem, namespace, instance);
            });
        });
    }, utils;
}), /* --------------------------------------------- Flickity logic starts --------------------------------------- */
// Flickity.Cell
function(window, factory) {
    // universal module definition
    /* jshint strict: false */
    "function" == typeof define && define.amd ? // AMD
    define("flickity/js/cell", [ "get-size/get-size" ], function(getSize) {
        return factory(window, getSize);
    }) : "object" == typeof module && module.exports ? // CommonJS
    module.exports = factory(window, require("get-size")) : (// browser global
    window.Flickity = window.Flickity || {}, window.Flickity.Cell = factory(window, window.getSize));
}(window, function(window, getSize) {
    function Cell(elem, parent) {
        this.element = elem, this.parent = parent, this.create();
    }
    var proto = Cell.prototype;
    // setDefaultTarget v1 method, backwards compatibility, remove in v3
    /**
     * @param {Integer} factor - 0, 1, or -1
     **/
    return proto.create = function() {
        this.element.style.position = "absolute", this.x = 0, this.shift = 0;
    }, proto.destroy = function() {
        // reset style
        this.element.style.position = "";
        var side = this.parent.originSide;
        this.element.style[side] = "";
    }, proto.getSize = function() {
        this.size = getSize(this.element);
    }, proto.setPosition = function(x) {
        this.x = x, this.updateTarget(), this.renderPosition(x);
    }, proto.updateTarget = proto.setDefaultTarget = function() {
        var marginProperty = "left" == this.parent.originSide ? "marginLeft" : "marginRight";
        this.target = this.x + this.size[marginProperty] + this.size.width * this.parent.cellAlign;
    }, proto.renderPosition = function(x) {
        // render position of cell with in slider
        var side = this.parent.originSide;
        this.element.style[side] = this.parent.getPositionValue(x);
    }, proto.wrapShift = function(shift) {
        this.shift = shift, this.renderPosition(this.x + this.parent.slideableWidth * shift);
    }, proto.remove = function() {
        this.element.parentNode.removeChild(this.element);
    }, Cell;
}), // slide
function(window, factory) {
    // universal module definition
    /* jshint strict: false */
    "function" == typeof define && define.amd ? // AMD
    define("flickity/js/slide", factory) : "object" == typeof module && module.exports ? // CommonJS
    module.exports = factory() : (// browser global
    window.Flickity = window.Flickity || {}, window.Flickity.Slide = factory());
}(window, function() {
    "use strict";
    function Slide(parent) {
        this.parent = parent, this.isOriginLeft = "left" == parent.originSide, this.cells = [], 
        this.outerWidth = 0, this.height = 0;
    }
    var proto = Slide.prototype;
    return proto.addCell = function(cell) {
        // first cell stuff
        if (this.cells.push(cell), this.outerWidth += cell.size.outerWidth, this.height = Math.max(cell.size.outerHeight, this.height), 
        1 == this.cells.length) {
            this.x = cell.x;
            // x comes from first cell
            var beginMargin = this.isOriginLeft ? "marginLeft" : "marginRight";
            this.firstMargin = cell.size[beginMargin];
        }
    }, proto.updateTarget = function() {
        var endMargin = this.isOriginLeft ? "marginRight" : "marginLeft", lastCell = this.getLastCell(), lastMargin = lastCell ? lastCell.size[endMargin] : 0, slideWidth = this.outerWidth - (this.firstMargin + lastMargin);
        this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
    }, proto.getLastCell = function() {
        return this.cells[this.cells.length - 1];
    }, proto.select = function() {
        this.changeSelectedClass("add");
    }, proto.unselect = function() {
        this.changeSelectedClass("remove");
    }, proto.changeSelectedClass = function(method) {
        this.cells.forEach(function(cell) {
            cell.element.classList[method]("is-selected");
        });
    }, proto.getCellElements = function() {
        return this.cells.map(function(cell) {
            return cell.element;
        });
    }, Slide;
}), // animate
function(window, factory) {
    // universal module definition
    /* jshint strict: false */
    "function" == typeof define && define.amd ? // AMD
    define("flickity/js/animate", [ "fizzy-ui-utils/utils" ], function(utils) {
        return factory(window, utils);
    }) : "object" == typeof module && module.exports ? // CommonJS
    module.exports = factory(window, require("fizzy-ui-utils")) : (// browser global
    window.Flickity = window.Flickity || {}, window.Flickity.animatePrototype = factory(window, window.fizzyUIUtils));
}(window, function(window, utils) {
    // -------------------------- requestAnimationFrame -------------------------- //
    // get rAF, prefixed, if present
    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame, lastTime = 0;
    requestAnimationFrame || (requestAnimationFrame = function(callback) {
        var currTime = new Date().getTime(), timeToCall = Math.max(0, 16 - (currTime - lastTime)), id = setTimeout(callback, timeToCall);
        return lastTime = currTime + timeToCall, id;
    });
    // -------------------------- animate -------------------------- //
    var proto = {};
    proto.startAnimation = function() {
        this.isAnimating || (this.isAnimating = !0, this.restingFrames = 0, this.animate());
    }, proto.animate = function() {
        this.applyDragForce(), this.applySelectedAttraction();
        var previousX = this.x;
        // animate next frame
        if (this.integratePhysics(), this.positionSlider(), this.settle(previousX), this.isAnimating) {
            var _this = this;
            requestAnimationFrame(function() {
                _this.animate();
            });
        }
    };
    var transformProperty = function() {
        var style = document.documentElement.style;
        return "string" == typeof style.transform ? "transform" : "WebkitTransform";
    }();
    // -------------------------- physics -------------------------- //
    return proto.positionSlider = function() {
        var x = this.x;
        // wrap position around
        this.options.wrapAround && this.cells.length > 1 && (x = utils.modulo(x, this.slideableWidth), 
        x -= this.slideableWidth, this.shiftWrapCells(x)), x += this.cursorPosition, x = this.options.rightToLeft && transformProperty ? -x : x;
        var value = this.getPositionValue(x);
        // use 3D tranforms for hardware acceleration on iOS
        // but use 2D when settled, for better font-rendering
        this.slider.style[transformProperty] = this.isAnimating ? "translate3d(" + value + ",0,0)" : "translateX(" + value + ")";
        // scroll event
        var firstSlide = this.slides[0];
        if (firstSlide) {
            var positionX = -this.x - firstSlide.target, progress = positionX / this.slidesWidth;
            this.dispatchEvent("scroll", null, [ progress, positionX ]);
        }
    }, proto.positionSliderAtSelected = function() {
        this.cells.length && (this.x = -this.selectedSlide.target, this.positionSlider());
    }, proto.getPositionValue = function(position) {
        return this.options.percentPosition ? .01 * Math.round(position / this.size.innerWidth * 1e4) + "%" : Math.round(position) + "px";
    }, proto.settle = function(previousX) {
        // keep track of frames where x hasn't moved
        this.isPointerDown || Math.round(100 * this.x) != Math.round(100 * previousX) || this.restingFrames++, 
        // stop animating if resting for 3 or more frames
        this.restingFrames > 2 && (this.isAnimating = !1, delete this.isFreeScrolling, // render position with translateX when settled
        this.positionSlider(), this.dispatchEvent("settle"));
    }, proto.shiftWrapCells = function(x) {
        // shift before cells
        var beforeGap = this.cursorPosition + x;
        this._shiftCells(this.beforeShiftCells, beforeGap, -1);
        // shift after cells
        var afterGap = this.size.innerWidth - (x + this.slideableWidth + this.cursorPosition);
        this._shiftCells(this.afterShiftCells, afterGap, 1);
    }, proto._shiftCells = function(cells, gap, shift) {
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i], cellShift = gap > 0 ? shift : 0;
            cell.wrapShift(cellShift), gap -= cell.size.outerWidth;
        }
    }, proto._unshiftCells = function(cells) {
        if (cells && cells.length) for (var i = 0; i < cells.length; i++) cells[i].wrapShift(0);
    }, proto.integratePhysics = function() {
        this.x += this.velocity, this.velocity *= this.getFrictionFactor();
    }, proto.applyForce = function(force) {
        this.velocity += force;
    }, proto.getFrictionFactor = function() {
        return 1 - this.options[this.isFreeScrolling ? "freeScrollFriction" : "friction"];
    }, proto.getRestingPosition = function() {
        // my thanks to Steven Wittens, who simplified this math greatly
        return this.x + this.velocity / (1 - this.getFrictionFactor());
    }, proto.applyDragForce = function() {
        if (this.isPointerDown) {
            // change the position to drag position by applying force
            var dragVelocity = this.dragX - this.x, dragForce = dragVelocity - this.velocity;
            this.applyForce(dragForce);
        }
    }, proto.applySelectedAttraction = function() {
        // do not attract if pointer down or no cells
        if (!this.isPointerDown && !this.isFreeScrolling && this.cells.length) {
            var distance = -1 * this.selectedSlide.target - this.x, force = distance * this.options.selectedAttraction;
            this.applyForce(force);
        }
    }, proto;
}), // Flickity main
function(window, factory) {
    // universal module definition
    /* jshint strict: false */
    if ("function" == typeof define && define.amd) // AMD
    define("flickity/js/flickity", [ "ev-emitter/ev-emitter", "get-size/get-size", "fizzy-ui-utils/utils", "./cell", "./slide", "./animate" ], function(EvEmitter, getSize, utils, Cell, Slide, animatePrototype) {
        return factory(window, EvEmitter, getSize, utils, Cell, Slide, animatePrototype);
    }); else if ("object" == typeof module && module.exports) // CommonJS
    module.exports = factory(window, require("ev-emitter"), require("get-size"), require("fizzy-ui-utils"), require("./cell"), require("./slide"), require("./animate")); else {
        // browser global
        var _Flickity = window.Flickity;
        window.Flickity = factory(window, window.EvEmitter, window.getSize, window.fizzyUIUtils, _Flickity.Cell, _Flickity.Slide, _Flickity.animatePrototype);
    }
}(window, function(window, EvEmitter, getSize, utils, Cell, Slide, animatePrototype) {
    function moveElements(elems, toElem) {
        for (elems = utils.makeArray(elems); elems.length; ) toElem.appendChild(elems.shift());
    }
    function Flickity(element, options) {
        var queryElement = utils.getQueryElement(element);
        if (!queryElement) return void (console && console.error("Bad element for Flickity: " + (queryElement || element)));
        // do not initialize twice on same element
        if (this.element = queryElement, this.element.flickityGUID) {
            var instance = instances[this.element.flickityGUID];
            return instance.option(options), instance;
        }
        // add jQuery
        jQuery && (this.$element = jQuery(this.element)), // options
        this.options = utils.extend({}, this.constructor.defaults), this.option(options), 
        // kick things off
        this._create();
    }
    // vars
    var jQuery = window.jQuery, getComputedStyle = window.getComputedStyle, console = window.console, GUID = 0, instances = {};
    Flickity.defaults = {
        accessibility: !0,
        // adaptiveHeight: false,
        cellAlign: "center",
        // cellSelector: undefined,
        // contain: false,
        freeScrollFriction: .075,
        // friction when free-scrolling
        friction: .28,
        // friction when selecting
        namespaceJQueryEvents: !0,
        // initialIndex: 0,
        percentPosition: !0,
        resize: !0,
        selectedAttraction: .025,
        setGallerySize: !0
    }, // hash of methods triggered on _create()
    Flickity.createMethods = [];
    var proto = Flickity.prototype;
    // inherit EventEmitter
    utils.extend(proto, EvEmitter.prototype), proto._create = function() {
        // add id for Flickity.data
        var id = this.guid = ++GUID;
        this.element.flickityGUID = id, // expando
        instances[id] = this, // associate via id
        // initial properties
        this.selectedIndex = 0, // how many frames slider has been in same position
        this.restingFrames = 0, // initial physics properties
        this.x = 0, this.velocity = 0, this.originSide = this.options.rightToLeft ? "right" : "left", 
        // create viewport & slider
        this.viewport = document.createElement("div"), this.viewport.className = "flickity-viewport", 
        this._createSlider(), (this.options.resize || this.options.watchCSS) && window.addEventListener("resize", this), 
        Flickity.createMethods.forEach(function(method) {
            this[method]();
        }, this), this.options.watchCSS ? this.watchCSS() : this.activate();
    }, /**
     * set options
     * @param {Object} opts
     */
    proto.option = function(opts) {
        utils.extend(this.options, opts);
    }, proto.activate = function() {
        if (!this.isActive) {
            this.isActive = !0, this.element.classList.add("flickity-enabled"), this.options.rightToLeft && this.element.classList.add("flickity-rtl"), 
            this.getSize();
            // move initial cell elements so they can be loaded as cells
            var cellElems = this._filterFindCellElements(this.element.children);
            moveElements(cellElems, this.slider), this.viewport.appendChild(this.slider), this.element.appendChild(this.viewport), 
            // get cells from children
            this.reloadCells(), this.options.accessibility && (// allow element to focusable
            this.element.tabIndex = 0, // listen for key presses
            this.element.addEventListener("keydown", this)), this.emitEvent("activate");
            var index, initialIndex = this.options.initialIndex;
            index = this.isInitActivated ? this.selectedIndex : void 0 !== initialIndex && this.cells[initialIndex] ? initialIndex : 0, 
            // select instantly
            this.select(index, !1, !0), // flag for initial activation, for using initialIndex
            this.isInitActivated = !0;
        }
    }, // slider positions the cells
    proto._createSlider = function() {
        // slider element does all the positioning
        var slider = document.createElement("div");
        slider.className = "flickity-slider", slider.style[this.originSide] = 0, this.slider = slider;
    }, proto._filterFindCellElements = function(elems) {
        return utils.filterFindElements(elems, this.options.cellSelector);
    }, // goes through all children
    proto.reloadCells = function() {
        // collection of item elements
        this.cells = this._makeCells(this.slider.children), this.positionCells(), this._getWrapShiftCells(), 
        this.setGallerySize();
    }, /**
     * turn elements into Flickity.Cells
     * @param {Array or NodeList or HTMLElement} elems
     * @returns {Array} items - collection of new Flickity Cells
     */
    proto._makeCells = function(elems) {
        var cellElems = this._filterFindCellElements(elems), cells = cellElems.map(function(cellElem) {
            return new Cell(cellElem, this);
        }, this);
        return cells;
    }, proto.getLastCell = function() {
        return this.cells[this.cells.length - 1];
    }, proto.getLastSlide = function() {
        return this.slides[this.slides.length - 1];
    }, // positions all cells
    proto.positionCells = function() {
        // size all cells
        this._sizeCells(this.cells), // position all cells
        this._positionCells(0);
    }, /**
     * position certain cells
     * @param {Integer} index - which cell to start with
     */
    proto._positionCells = function(index) {
        index = index || 0, this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
        var cellX = 0;
        // get cellX
        if (index > 0) {
            var startCell = this.cells[index - 1];
            cellX = startCell.x + startCell.size.outerWidth;
        }
        for (var len = this.cells.length, i = index; len > i; i++) {
            var cell = this.cells[i];
            cell.setPosition(cellX), cellX += cell.size.outerWidth, this.maxCellHeight = Math.max(cell.size.outerHeight, this.maxCellHeight);
        }
        // keep track of cellX for wrap-around
        this.slideableWidth = cellX, // slides
        this.updateSlides(), // contain slides target
        this._containSlides(), // update slidesWidth
        this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
    }, /**
     * cell.getSize() on multiple cells
     * @param {Array} cells
     */
    proto._sizeCells = function(cells) {
        cells.forEach(function(cell) {
            cell.getSize();
        });
    }, // --------------------------  -------------------------- //
    proto.updateSlides = function() {
        if (this.slides = [], this.cells.length) {
            var slide = new Slide(this);
            this.slides.push(slide);
            var isOriginLeft = "left" == this.originSide, nextMargin = isOriginLeft ? "marginRight" : "marginLeft", canCellFit = this._getCanCellFit();
            this.cells.forEach(function(cell, i) {
                // just add cell if first cell in slide
                if (!slide.cells.length) return void slide.addCell(cell);
                var slideWidth = slide.outerWidth - slide.firstMargin + (cell.size.outerWidth - cell.size[nextMargin]);
                canCellFit.call(this, i, slideWidth) ? slide.addCell(cell) : (// doesn't fit, new slide
                slide.updateTarget(), slide = new Slide(this), this.slides.push(slide), slide.addCell(cell));
            }, this), // last slide
            slide.updateTarget(), // update .selectedSlide
            this.updateSelectedSlide();
        }
    }, proto._getCanCellFit = function() {
        var groupCells = this.options.groupCells;
        if (!groupCells) return function() {
            return !1;
        };
        if ("number" == typeof groupCells) {
            // group by number. 3 -> [0,1,2], [3,4,5], ...
            var number = parseInt(groupCells, 10);
            return function(i) {
                return i % number !== 0;
            };
        }
        // default, group by width of slide
        // parse '75%
        var percentMatch = "string" == typeof groupCells && groupCells.match(/^(\d+)%$/), percent = percentMatch ? parseInt(percentMatch[1], 10) / 100 : 1;
        return function(i, slideWidth) {
            return slideWidth <= (this.size.innerWidth + 1) * percent;
        };
    }, // alias _init for jQuery plugin .flickity()
    proto._init = proto.reposition = function() {
        this.positionCells(), this.positionSliderAtSelected();
    }, proto.getSize = function() {
        this.size = getSize(this.element), this.setCellAlign(), this.cursorPosition = this.size.innerWidth * this.cellAlign;
    };
    var cellAlignShorthands = {
        // cell align, then based on origin side
        center: {
            left: .5,
            right: .5
        },
        left: {
            left: 0,
            right: 1
        },
        right: {
            right: 0,
            left: 1
        }
    };
    // ----- contain ----- //
    // contain cell targets so no excess sliding
    // -----  ----- //
    /**
     * emits events via eventEmitter and jQuery events
     * @param {String} type - name of event
     * @param {Event} event - original event
     * @param {Array} args - extra arguments
     */
    // -------------------------- select -------------------------- //
    /**
     * @param {Integer} index - index of the slide
     * @param {Boolean} isWrap - will wrap-around to last/first if at the end
     * @param {Boolean} isInstant - will immediately set position at selected cell
     */
    // wraps position for wrapAround, to move to closest slide. #113
    /**
     * select slide from number or cell element
     * @param {Element or Number} elem
     */
    // -------------------------- get cells -------------------------- //
    /**
     * get Flickity.Cell, given an Element
     * @param {Element} elem
     * @returns {Flickity.Cell} item
     */
    /**
     * get collection of Flickity.Cells, given Elements
     * @param {Element, Array, NodeList} elems
     * @returns {Array} cells - Flickity.Cells
     */
    /**
     * get cell elements
     * @returns {Array} cellElems
     */
    /**
     * get parent cell from an element
     * @param {Element} elem
     * @returns {Flickit.Cell} cell
     */
    /**
     * get cells adjacent to a slide
     * @param {Integer} adjCount - number of adjacent slides
     * @param {Integer} index - index of slide to start
     * @returns {Array} cells - array of Flickity.Cells
     */
    // -------------------------- events -------------------------- //
    // ----- resize ----- //
    // watches the :after property, activates/deactivates
    // ----- keydown ----- //
    // go previous/next if left/right keys pressed
    // -------------------------- destroy -------------------------- //
    // deactivate all Flickity functionality, but keep stuff available
    // -------------------------- prototype -------------------------- //
    // -------------------------- extras -------------------------- //
    /**
     * get Flickity instance from element
     * @param {Element} elem
     * @returns {Flickity}
     */
    return proto.setCellAlign = function() {
        var shorthand = cellAlignShorthands[this.options.cellAlign];
        this.cellAlign = shorthand ? shorthand[this.originSide] : this.options.cellAlign;
    }, proto.setGallerySize = function() {
        if (this.options.setGallerySize) {
            var height = this.options.adaptiveHeight && this.selectedSlide ? this.selectedSlide.height : this.maxCellHeight;
            this.viewport.style.height = height + "px";
        }
    }, proto._getWrapShiftCells = function() {
        // only for wrap-around
        if (this.options.wrapAround) {
            // unshift previous cells
            this._unshiftCells(this.beforeShiftCells), this._unshiftCells(this.afterShiftCells);
            // get before cells
            // initial gap
            var gapX = this.cursorPosition, cellIndex = this.cells.length - 1;
            this.beforeShiftCells = this._getGapCells(gapX, cellIndex, -1), // get after cells
            // ending gap between last cell and end of gallery viewport
            gapX = this.size.innerWidth - this.cursorPosition, // start cloning at first cell, working forwards
            this.afterShiftCells = this._getGapCells(gapX, 0, 1);
        }
    }, proto._getGapCells = function(gapX, cellIndex, increment) {
        for (// keep adding cells until the cover the initial gap
        var cells = []; gapX > 0; ) {
            var cell = this.cells[cellIndex];
            if (!cell) break;
            cells.push(cell), cellIndex += increment, gapX -= cell.size.outerWidth;
        }
        return cells;
    }, proto._containSlides = function() {
        if (this.options.contain && !this.options.wrapAround && this.cells.length) {
            var isRightToLeft = this.options.rightToLeft, beginMargin = isRightToLeft ? "marginRight" : "marginLeft", endMargin = isRightToLeft ? "marginLeft" : "marginRight", contentWidth = this.slideableWidth - this.getLastCell().size[endMargin], isContentSmaller = contentWidth < this.size.innerWidth, beginBound = this.cursorPosition + this.cells[0].size[beginMargin], endBound = contentWidth - this.size.innerWidth * (1 - this.cellAlign);
            // contain each cell target
            this.slides.forEach(function(slide) {
                isContentSmaller ? // all cells fit inside gallery
                slide.target = contentWidth * this.cellAlign : (// contain to bounds
                slide.target = Math.max(slide.target, beginBound), slide.target = Math.min(slide.target, endBound));
            }, this);
        }
    }, proto.dispatchEvent = function(type, event, args) {
        var emitArgs = event ? [ event ].concat(args) : args;
        if (this.emitEvent(type, emitArgs), jQuery && this.$element) {
            // default trigger with type if no event
            type += this.options.namespaceJQueryEvents ? ".flickity" : "";
            var $event = type;
            if (event) {
                // create jQuery event
                var jQEvent = jQuery.Event(event);
                jQEvent.type = type, $event = jQEvent;
            }
            this.$element.trigger($event, args);
        }
    }, proto.select = function(index, isWrap, isInstant) {
        this.isActive && (index = parseInt(index, 10), this._wrapSelect(index), (this.options.wrapAround || isWrap) && (index = utils.modulo(index, this.slides.length)), 
        this.slides[index] && (this.selectedIndex = index, this.updateSelectedSlide(), isInstant ? this.positionSliderAtSelected() : this.startAnimation(), 
        this.options.adaptiveHeight && this.setGallerySize(), this.dispatchEvent("select"), 
        this.dispatchEvent("cellSelect")));
    }, proto._wrapSelect = function(index) {
        var len = this.slides.length, isWrapping = this.options.wrapAround && len > 1;
        if (!isWrapping) return index;
        var wrapIndex = utils.modulo(index, len), delta = Math.abs(wrapIndex - this.selectedIndex), backWrapDelta = Math.abs(wrapIndex + len - this.selectedIndex), forewardWrapDelta = Math.abs(wrapIndex - len - this.selectedIndex);
        !this.isDragSelect && delta > backWrapDelta ? index += len : !this.isDragSelect && delta > forewardWrapDelta && (index -= len), 
        // wrap position so slider is within normal area
        0 > index ? this.x -= this.slideableWidth : index >= len && (this.x += this.slideableWidth);
    }, proto.previous = function(isWrap, isInstant) {
        this.select(this.selectedIndex - 1, isWrap, isInstant);
    }, proto.next = function(isWrap, isInstant) {
        this.select(this.selectedIndex + 1, isWrap, isInstant);
    }, proto.updateSelectedSlide = function() {
        var slide = this.slides[this.selectedIndex];
        // selectedIndex could be outside of slides, if triggered before resize()
        slide && (// unselect previous selected slide
        this.unselectSelectedSlide(), // update new selected slide
        this.selectedSlide = slide, slide.select(), this.selectedCells = slide.cells, this.selectedElements = slide.getCellElements(), 
        // HACK: selectedCell & selectedElement is first cell in slide, backwards compatibility
        // Remove in v3?
        this.selectedCell = slide.cells[0], this.selectedElement = this.selectedElements[0]);
    }, proto.unselectSelectedSlide = function() {
        this.selectedSlide && this.selectedSlide.unselect();
    }, proto.selectCell = function(value, isWrap, isInstant) {
        // get cell
        var cell;
        "number" == typeof value ? cell = this.cells[value] : (// use string as selector
        "string" == typeof value && (value = this.element.querySelector(value)), // get cell from element
        cell = this.getCell(value));
        // select slide that has cell
        for (var i = 0; cell && i < this.slides.length; i++) {
            var slide = this.slides[i], index = slide.cells.indexOf(cell);
            if (-1 != index) return void this.select(i, isWrap, isInstant);
        }
    }, proto.getCell = function(elem) {
        // loop through cells to get the one that matches
        for (var i = 0; i < this.cells.length; i++) {
            var cell = this.cells[i];
            if (cell.element == elem) return cell;
        }
    }, proto.getCells = function(elems) {
        elems = utils.makeArray(elems);
        var cells = [];
        return elems.forEach(function(elem) {
            var cell = this.getCell(elem);
            cell && cells.push(cell);
        }, this), cells;
    }, proto.getCellElements = function() {
        return this.cells.map(function(cell) {
            return cell.element;
        });
    }, proto.getParentCell = function(elem) {
        // first check if elem is cell
        var cell = this.getCell(elem);
        // try to get parent cell elem
        return cell ? cell : (elem = utils.getParent(elem, ".flickity-slider > *"), this.getCell(elem));
    }, proto.getAdjacentCellElements = function(adjCount, index) {
        if (!adjCount) return this.selectedSlide.getCellElements();
        index = void 0 === index ? this.selectedIndex : index;
        var len = this.slides.length;
        if (1 + 2 * adjCount >= len) return this.getCellElements();
        for (var cellElems = [], i = index - adjCount; index + adjCount >= i; i++) {
            var slideIndex = this.options.wrapAround ? utils.modulo(i, len) : i, slide = this.slides[slideIndex];
            slide && (cellElems = cellElems.concat(slide.getCellElements()));
        }
        return cellElems;
    }, proto.uiChange = function() {
        this.emitEvent("uiChange");
    }, proto.childUIPointerDown = function(event) {
        this.emitEvent("childUIPointerDown", [ event ]);
    }, proto.onresize = function() {
        this.watchCSS(), this.resize();
    }, utils.debounceMethod(Flickity, "onresize", 150), proto.resize = function() {
        if (this.isActive) {
            this.getSize(), // wrap values
            this.options.wrapAround && (this.x = utils.modulo(this.x, this.slideableWidth)), 
            this.positionCells(), this._getWrapShiftCells(), this.setGallerySize(), this.emitEvent("resize");
            // update selected index for group slides, instant
            // TODO: position can be lost between groups of various numbers
            var selectedElement = this.selectedElements && this.selectedElements[0];
            this.selectCell(selectedElement, !1, !0);
        }
    }, proto.watchCSS = function() {
        var watchOption = this.options.watchCSS;
        if (watchOption) {
            var afterContent = getComputedStyle(this.element, ":after").content;
            // activate if :after { content: 'flickity' }
            -1 != afterContent.indexOf("flickity") ? this.activate() : this.deactivate();
        }
    }, proto.onkeydown = function(event) {
        // only work if element is in focus
        if (this.options.accessibility && (!document.activeElement || document.activeElement == this.element)) if (37 == event.keyCode) {
            // go left
            var leftMethod = this.options.rightToLeft ? "next" : "previous";
            this.uiChange(), this[leftMethod]();
        } else if (39 == event.keyCode) {
            // go right
            var rightMethod = this.options.rightToLeft ? "previous" : "next";
            this.uiChange(), this[rightMethod]();
        }
    }, proto.deactivate = function() {
        this.isActive && (this.element.classList.remove("flickity-enabled"), this.element.classList.remove("flickity-rtl"), 
        // destroy cells
        this.cells.forEach(function(cell) {
            cell.destroy();
        }), this.unselectSelectedSlide(), this.element.removeChild(this.viewport), // move child elements back into element
        moveElements(this.slider.children, this.element), this.options.accessibility && (this.element.removeAttribute("tabIndex"), 
        this.element.removeEventListener("keydown", this)), // set flags
        this.isActive = !1, this.emitEvent("deactivate"));
    }, proto.destroy = function() {
        this.deactivate(), window.removeEventListener("resize", this), this.emitEvent("destroy"), 
        jQuery && this.$element && jQuery.removeData(this.element, "flickity"), delete this.element.flickityGUID, 
        delete instances[this.guid];
    }, utils.extend(proto, animatePrototype), Flickity.data = function(elem) {
        elem = utils.getQueryElement(elem);
        var id = elem && elem.flickityGUID;
        return id && instances[id];
    }, utils.htmlInit(Flickity, "flickity"), Flickity.Cell = Cell, Flickity;
}), /* --------------------------------------------- Flickity logic ends --------------------------------------- */
/*!
 * Unipointer v2.1.0
 * base class for doing one thing with pointer event
 * MIT license
 */
/*jshint browser: true, undef: true, unused: true, strict: true */
function(window, factory) {
    // universal module definition
    /* jshint strict: false */
    /*global define, module, require */
    "function" == typeof define && define.amd ? // AMD
    define("unipointer/unipointer", [ "ev-emitter/ev-emitter" ], function(EvEmitter) {
        return factory(window, EvEmitter);
    }) : "object" == typeof module && module.exports ? module.exports = factory(window, require("ev-emitter")) : window.Unipointer = factory(window, window.EvEmitter);
}(window, function(window, EvEmitter) {
    function noop() {}
    function Unipointer() {}
    // inherit EvEmitter
    var proto = Unipointer.prototype = Object.create(EvEmitter.prototype);
    proto.bindStartEvent = function(elem) {
        this._bindStartEvent(elem, !0);
    }, proto.unbindStartEvent = function(elem) {
        this._bindStartEvent(elem, !1);
    }, /**
     * works as unbinder, as you can ._bindStart( false ) to unbind
     * @param {Boolean} isBind - will unbind if falsey
     */
    proto._bindStartEvent = function(elem, isBind) {
        // munge isBind, default to true
        isBind = void 0 === isBind ? !0 : !!isBind;
        var bindMethod = isBind ? "addEventListener" : "removeEventListener";
        window.navigator.pointerEnabled ? // W3C Pointer Events, IE11. See https://coderwall.com/p/mfreca
        elem[bindMethod]("pointerdown", this) : window.navigator.msPointerEnabled ? // IE10 Pointer Events
        elem[bindMethod]("MSPointerDown", this) : (// listen for both, for devices like Chrome Pixel
        elem[bindMethod]("mousedown", this), elem[bindMethod]("touchstart", this));
    }, // trigger handler methods for events
    proto.handleEvent = function(event) {
        var method = "on" + event.type;
        this[method] && this[method](event);
    }, // returns the touch that we're keeping track of
    proto.getTouch = function(touches) {
        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            if (touch.identifier == this.pointerIdentifier) return touch;
        }
    }, // ----- start event ----- //
    proto.onmousedown = function(event) {
        // dismiss clicks from right or middle buttons
        var button = event.button;
        button && 0 !== button && 1 !== button || this._pointerDown(event, event);
    }, proto.ontouchstart = function(event) {
        this._pointerDown(event, event.changedTouches[0]);
    }, proto.onMSPointerDown = proto.onpointerdown = function(event) {
        this._pointerDown(event, event);
    }, /**
     * pointer start
     * @param {Event} event
     * @param {Event or Touch} pointer
     */
    proto._pointerDown = function(event, pointer) {
        // dismiss other pointers
        this.isPointerDown || (this.isPointerDown = !0, // save pointer identifier to match up touch events
        this.pointerIdentifier = void 0 !== pointer.pointerId ? // pointerId for pointer events, touch.indentifier for touch events
        pointer.pointerId : pointer.identifier, this.pointerDown(event, pointer));
    }, proto.pointerDown = function(event, pointer) {
        this._bindPostStartEvents(event), this.emitEvent("pointerDown", [ event, pointer ]);
    };
    // hash of events to be bound after start event
    var postStartEvents = {
        mousedown: [ "mousemove", "mouseup" ],
        touchstart: [ "touchmove", "touchend", "touchcancel" ],
        pointerdown: [ "pointermove", "pointerup", "pointercancel" ],
        MSPointerDown: [ "MSPointerMove", "MSPointerUp", "MSPointerCancel" ]
    };
    // -----  ----- //
    // ----- move event ----- //
    /**
     * pointer move
     * @param {Event} event
     * @param {Event or Touch} pointer
     * @private
     */
    // public
    // ----- end event ----- //
    /**
     * pointer up
     * @param {Event} event
     * @param {Event or Touch} pointer
     * @private
     */
    // public
    // ----- pointer done ----- //
    // triggered on pointer up & pointer cancel
    // ----- pointer cancel ----- //
    /**
     * pointer cancel
     * @param {Event} event
     * @param {Event or Touch} pointer
     * @private
     */
    // public
    // -----  ----- //
    // utility function for getting x/y coords from event
    return proto._bindPostStartEvents = function(event) {
        if (event) {
            // get proper events to match start event
            var events = postStartEvents[event.type];
            // bind events to node
            events.forEach(function(eventName) {
                window.addEventListener(eventName, this);
            }, this), // save these arguments
            this._boundPointerEvents = events;
        }
    }, proto._unbindPostStartEvents = function() {
        // check for _boundEvents, in case dragEnd triggered twice (old IE8 bug)
        this._boundPointerEvents && (this._boundPointerEvents.forEach(function(eventName) {
            window.removeEventListener(eventName, this);
        }, this), delete this._boundPointerEvents);
    }, proto.onmousemove = function(event) {
        this._pointerMove(event, event);
    }, proto.onMSPointerMove = proto.onpointermove = function(event) {
        event.pointerId == this.pointerIdentifier && this._pointerMove(event, event);
    }, proto.ontouchmove = function(event) {
        var touch = this.getTouch(event.changedTouches);
        touch && this._pointerMove(event, touch);
    }, proto._pointerMove = function(event, pointer) {
        this.pointerMove(event, pointer);
    }, proto.pointerMove = function(event, pointer) {
        this.emitEvent("pointerMove", [ event, pointer ]);
    }, proto.onmouseup = function(event) {
        this._pointerUp(event, event);
    }, proto.onMSPointerUp = proto.onpointerup = function(event) {
        event.pointerId == this.pointerIdentifier && this._pointerUp(event, event);
    }, proto.ontouchend = function(event) {
        var touch = this.getTouch(event.changedTouches);
        touch && this._pointerUp(event, touch);
    }, proto._pointerUp = function(event, pointer) {
        this._pointerDone(), this.pointerUp(event, pointer);
    }, proto.pointerUp = function(event, pointer) {
        this.emitEvent("pointerUp", [ event, pointer ]);
    }, proto._pointerDone = function() {
        // reset properties
        this.isPointerDown = !1, delete this.pointerIdentifier, // remove events
        this._unbindPostStartEvents(), this.pointerDone();
    }, proto.pointerDone = noop, proto.onMSPointerCancel = proto.onpointercancel = function(event) {
        event.pointerId == this.pointerIdentifier && this._pointerCancel(event, event);
    }, proto.ontouchcancel = function(event) {
        var touch = this.getTouch(event.changedTouches);
        touch && this._pointerCancel(event, touch);
    }, proto._pointerCancel = function(event, pointer) {
        this._pointerDone(), this.pointerCancel(event, pointer);
    }, proto.pointerCancel = function(event, pointer) {
        this.emitEvent("pointerCancel", [ event, pointer ]);
    }, Unipointer.getPointerPoint = function(pointer) {
        return {
            x: pointer.pageX,
            y: pointer.pageY
        };
    }, Unipointer;
}), /*!
 * Unidragger v2.1.0
 * Draggable base class
 * MIT license
 */
/*jshint browser: true, unused: true, undef: true, strict: true */
function(window, factory) {
    // universal module definition
    /*jshint strict: false */
    /*globals define, module, require */
    "function" == typeof define && define.amd ? // AMD
    define("unidragger/unidragger", [ "unipointer/unipointer" ], function(Unipointer) {
        return factory(window, Unipointer);
    }) : "object" == typeof module && module.exports ? module.exports = factory(window, require("unipointer")) : window.Unidragger = factory(window, window.Unipointer);
}(window, function(window, Unipointer) {
    // -----  ----- //
    function noop() {}
    // -------------------------- Unidragger -------------------------- //
    function Unidragger() {}
    // inherit Unipointer & EvEmitter
    var proto = Unidragger.prototype = Object.create(Unipointer.prototype);
    // ----- bind start ----- //
    proto.bindHandles = function() {
        this._bindHandles(!0);
    }, proto.unbindHandles = function() {
        this._bindHandles(!1);
    };
    var navigator = window.navigator;
    // -----  ----- //
    /**
     * works as unbinder, as you can .bindHandles( false ) to unbind
     * @param {Boolean} isBind - will unbind if falsey
     */
    // ----- start event ----- //
    /**
     * pointer start
     * @param {Event} event
     * @param {Event or Touch} pointer
     */
    // base pointer down logic
    // overwriteable method so Flickity can prevent for scrolling
    // ----- move event ----- //
    /**
     * drag move
     * @param {Event} event
     * @param {Event or Touch} pointer
     */
    // base pointer move logic
    // condition if pointer has moved far enough to start drag
    // ----- end event ----- //
    /**
     * pointer up
     * @param {Event} event
     * @param {Event or Touch} pointer
     */
    // -------------------------- drag -------------------------- //
    // dragStart
    // dragMove
    // dragEnd
    // ----- onclick ----- //
    // handle all clicks and prevent clicks when dragging
    // ----- staticClick ----- //
    // triggered after pointer down & up with no/tiny movement
    // ----- utils ----- //
    return proto._bindHandles = function(isBind) {
        // munge isBind, default to true
        isBind = void 0 === isBind ? !0 : !!isBind;
        // extra bind logic
        var binderExtra;
        binderExtra = navigator.pointerEnabled ? function(handle) {
            // disable scrolling on the element
            handle.style.touchAction = isBind ? "none" : "";
        } : navigator.msPointerEnabled ? function(handle) {
            // disable scrolling on the element
            handle.style.msTouchAction = isBind ? "none" : "";
        } : noop;
        for (var bindMethod = isBind ? "addEventListener" : "removeEventListener", i = 0; i < this.handles.length; i++) {
            var handle = this.handles[i];
            this._bindStartEvent(handle, isBind), binderExtra(handle), handle[bindMethod]("click", this);
        }
    }, proto.pointerDown = function(event, pointer) {
        // dismiss range sliders
        if ("INPUT" == event.target.nodeName && "range" == event.target.type) // reset pointerDown logic
        return this.isPointerDown = !1, void delete this.pointerIdentifier;
        this._dragPointerDown(event, pointer);
        // kludge to blur focused inputs in dragger
        var focused = document.activeElement;
        focused && focused.blur && focused.blur(), // bind move and end events
        this._bindPostStartEvents(event), this.emitEvent("pointerDown", [ event, pointer ]);
    }, proto._dragPointerDown = function(event, pointer) {
        // track to see when dragging starts
        this.pointerDownPoint = Unipointer.getPointerPoint(pointer);
        var canPreventDefault = this.canPreventDefaultOnPointerDown(event, pointer);
        canPreventDefault && event.preventDefault();
    }, proto.canPreventDefaultOnPointerDown = function(event) {
        // prevent default, unless touchstart or <select>
        return "SELECT" != event.target.nodeName;
    }, proto.pointerMove = function(event, pointer) {
        var moveVector = this._dragPointerMove(event, pointer);
        this.emitEvent("pointerMove", [ event, pointer, moveVector ]), this._dragMove(event, pointer, moveVector);
    }, proto._dragPointerMove = function(event, pointer) {
        var movePoint = Unipointer.getPointerPoint(pointer), moveVector = {
            x: movePoint.x - this.pointerDownPoint.x,
            y: movePoint.y - this.pointerDownPoint.y
        };
        // start drag if pointer has moved far enough to start drag
        return !this.isDragging && this.hasDragStarted(moveVector) && this._dragStart(event, pointer), 
        moveVector;
    }, proto.hasDragStarted = function(moveVector) {
        return Math.abs(moveVector.x) > 3 || Math.abs(moveVector.y) > 3;
    }, proto.pointerUp = function(event, pointer) {
        this.emitEvent("pointerUp", [ event, pointer ]), this._dragPointerUp(event, pointer);
    }, proto._dragPointerUp = function(event, pointer) {
        this.isDragging ? this._dragEnd(event, pointer) : // pointer didn't move enough for drag to start
        this._staticClick(event, pointer);
    }, proto._dragStart = function(event, pointer) {
        this.isDragging = !0, this.dragStartPoint = Unipointer.getPointerPoint(pointer), 
        // prevent clicks
        this.isPreventingClicks = !0, this.dragStart(event, pointer);
    }, proto.dragStart = function(event, pointer) {
        this.emitEvent("dragStart", [ event, pointer ]);
    }, proto._dragMove = function(event, pointer, moveVector) {
        // do not drag if not dragging yet
        this.isDragging && this.dragMove(event, pointer, moveVector);
    }, proto.dragMove = function(event, pointer, moveVector) {
        event.preventDefault(), this.emitEvent("dragMove", [ event, pointer, moveVector ]);
    }, proto._dragEnd = function(event, pointer) {
        // set flags
        this.isDragging = !1, // re-enable clicking async
        setTimeout(function() {
            delete this.isPreventingClicks;
        }.bind(this)), this.dragEnd(event, pointer);
    }, proto.dragEnd = function(event, pointer) {
        this.emitEvent("dragEnd", [ event, pointer ]);
    }, proto.onclick = function(event) {
        this.isPreventingClicks && event.preventDefault();
    }, proto._staticClick = function(event, pointer) {
        // ignore emulated mouse up clicks
        if (!this.isIgnoringMouseUp || "mouseup" != event.type) {
            // allow click in <input>s and <textarea>s
            var nodeName = event.target.nodeName;
            ("INPUT" == nodeName || "TEXTAREA" == nodeName) && event.target.focus(), this.staticClick(event, pointer), 
            // set flag for emulated clicks 300ms after touchend
            "mouseup" != event.type && (this.isIgnoringMouseUp = !0, // reset flag after 300ms
            setTimeout(function() {
                delete this.isIgnoringMouseUp;
            }.bind(this), 400));
        }
    }, proto.staticClick = function(event, pointer) {
        this.emitEvent("staticClick", [ event, pointer ]);
    }, Unidragger.getPointerPoint = Unipointer.getPointerPoint, Unidragger;
}), // drag
function(window, factory) {
    // universal module definition
    /* jshint strict: false */
    "function" == typeof define && define.amd ? // AMD
    define("flickity/js/drag", [ "./flickity", "unidragger/unidragger", "fizzy-ui-utils/utils" ], function(Flickity, Unidragger, utils) {
        return factory(window, Flickity, Unidragger, utils);
    }) : "object" == typeof module && module.exports ? module.exports = factory(window, require("./flickity"), require("unidragger"), require("fizzy-ui-utils")) : window.Flickity = factory(window, window.Flickity, window.Unidragger, window.fizzyUIUtils);
}(window, function(window, Flickity, Unidragger, utils) {
    // ----- utils ----- //
    function getScrollPosition() {
        return {
            x: window.pageXOffset,
            y: window.pageYOffset
        };
    }
    // ----- defaults ----- //
    utils.extend(Flickity.defaults, {
        draggable: !0,
        dragThreshold: 3
    }), // ----- create ----- //
    Flickity.createMethods.push("_createDrag");
    // -------------------------- drag prototype -------------------------- //
    var proto = Flickity.prototype;
    utils.extend(proto, Unidragger.prototype);
    // --------------------------  -------------------------- //
    var isTouch = "createTouch" in document, isTouchmoveScrollCanceled = !1;
    proto._createDrag = function() {
        this.on("activate", this.bindDrag), this.on("uiChange", this._uiChangeDrag), this.on("childUIPointerDown", this._childUIPointerDownDrag), 
        this.on("deactivate", this.unbindDrag), // HACK - add seemingly innocuous handler to fix iOS 10 scroll behavior
        // #457, RubaXa/Sortable#973
        isTouch && !isTouchmoveScrollCanceled && (window.addEventListener("touchmove", function() {}), 
        isTouchmoveScrollCanceled = !0);
    }, proto.bindDrag = function() {
        this.options.draggable && !this.isDragBound && (this.element.classList.add("is-draggable"), 
        this.handles = [ this.viewport ], this.bindHandles(), this.isDragBound = !0);
    }, proto.unbindDrag = function() {
        this.isDragBound && (this.element.classList.remove("is-draggable"), this.unbindHandles(), 
        delete this.isDragBound);
    }, proto._uiChangeDrag = function() {
        delete this.isFreeScrolling;
    }, proto._childUIPointerDownDrag = function(event) {
        event.preventDefault(), this.pointerDownFocus(event);
    };
    // -------------------------- pointer events -------------------------- //
    // nodes that have text fields
    var cursorNodes = {
        TEXTAREA: !0,
        INPUT: !0,
        OPTION: !0
    }, clickTypes = {
        radio: !0,
        checkbox: !0,
        button: !0,
        submit: !0,
        image: !0,
        file: !0
    };
    proto.pointerDown = function(event, pointer) {
        // dismiss inputs with text fields. #403, #404
        var isCursorInput = cursorNodes[event.target.nodeName] && !clickTypes[event.target.type];
        if (isCursorInput) // reset pointerDown logic
        return this.isPointerDown = !1, void delete this.pointerIdentifier;
        this._dragPointerDown(event, pointer);
        // kludge to blur focused inputs in dragger
        var focused = document.activeElement;
        focused && focused.blur && focused != this.element && focused != document.body && focused.blur(), 
        this.pointerDownFocus(event), // stop if it was moving
        this.dragX = this.x, this.viewport.classList.add("is-pointer-down"), // bind move and end events
        this._bindPostStartEvents(event), // track scrolling
        this.pointerDownScroll = getScrollPosition(), window.addEventListener("scroll", this), 
        this.dispatchEvent("pointerDown", event, [ pointer ]);
    };
    var touchStartEvents = {
        touchstart: !0,
        MSPointerDown: !0
    }, focusNodes = {
        INPUT: !0,
        SELECT: !0
    };
    // -----  ----- //
    // ----- move ----- //
    // ----- up ----- //
    // -------------------------- dragging -------------------------- //
    /**
     * given resting X and distance to selected cell
     * get the distance and index of the closest cell
     * @param {Number} restingX - estimated post-flick resting position
     * @param {Number} distance - distance to selected cell
     * @param {Integer} increment - +1 or -1, going up or down
     * @returns {Object} - { distance: {Number}, index: {Integer} }
     */
    /**
     * measure distance between x and a slide target
     * @param {Number} x
     * @param {Integer} index - slide index
     */
    // ----- staticClick ----- //
    // ----- scroll ----- //
    return proto.pointerDownFocus = function(event) {
        // focus element, if not touch, and its not an input or select
        if (this.options.accessibility && !touchStartEvents[event.type] && !focusNodes[event.target.nodeName]) {
            var prevScrollY = window.pageYOffset;
            this.element.focus(), // hack to fix scroll jump after focus, #76
            window.pageYOffset != prevScrollY && window.scrollTo(window.pageXOffset, prevScrollY);
        }
    }, proto.canPreventDefaultOnPointerDown = function(event) {
        // prevent default, unless touchstart or <select>
        var isTouchstart = "touchstart" == event.type, targetNodeName = event.target.nodeName;
        return !isTouchstart && "SELECT" != targetNodeName;
    }, proto.hasDragStarted = function(moveVector) {
        return Math.abs(moveVector.x) > this.options.dragThreshold;
    }, proto.pointerUp = function(event, pointer) {
        delete this.isTouchScrolling, this.viewport.classList.remove("is-pointer-down"), 
        this.dispatchEvent("pointerUp", event, [ pointer ]), this._dragPointerUp(event, pointer);
    }, proto.pointerDone = function() {
        window.removeEventListener("scroll", this), delete this.pointerDownScroll;
    }, proto.dragStart = function(event, pointer) {
        this.dragStartPosition = this.x, this.startAnimation(), window.removeEventListener("scroll", this), 
        this.dispatchEvent("dragStart", event, [ pointer ]);
    }, proto.pointerMove = function(event, pointer) {
        var moveVector = this._dragPointerMove(event, pointer);
        this.dispatchEvent("pointerMove", event, [ pointer, moveVector ]), this._dragMove(event, pointer, moveVector);
    }, proto.dragMove = function(event, pointer, moveVector) {
        event.preventDefault(), this.previousDragX = this.dragX;
        // reverse if right-to-left
        var direction = this.options.rightToLeft ? -1 : 1, dragX = this.dragStartPosition + moveVector.x * direction;
        if (!this.options.wrapAround && this.slides.length) {
            // slow drag
            var originBound = Math.max(-this.slides[0].target, this.dragStartPosition);
            dragX = dragX > originBound ? .5 * (dragX + originBound) : dragX;
            var endBound = Math.min(-this.getLastSlide().target, this.dragStartPosition);
            dragX = endBound > dragX ? .5 * (dragX + endBound) : dragX;
        }
        this.dragX = dragX, this.dragMoveTime = new Date(), this.dispatchEvent("dragMove", event, [ pointer, moveVector ]);
    }, proto.dragEnd = function(event, pointer) {
        this.options.freeScroll && (this.isFreeScrolling = !0);
        // set selectedIndex based on where flick will end up
        var index = this.dragEndRestingSelect();
        if (this.options.freeScroll && !this.options.wrapAround) {
            // if free-scroll & not wrap around
            // do not free-scroll if going outside of bounding slides
            // so bounding slides can attract slider, and keep it in bounds
            var restingX = this.getRestingPosition();
            this.isFreeScrolling = -restingX > this.slides[0].target && -restingX < this.getLastSlide().target;
        } else this.options.freeScroll || index != this.selectedIndex || (// boost selection if selected index has not changed
        index += this.dragEndBoostSelect());
        delete this.previousDragX, // apply selection
        // TODO refactor this, selecting here feels weird
        // HACK, set flag so dragging stays in correct direction
        this.isDragSelect = this.options.wrapAround, this.select(index), delete this.isDragSelect, 
        this.dispatchEvent("dragEnd", event, [ pointer ]);
    }, proto.dragEndRestingSelect = function() {
        var restingX = this.getRestingPosition(), distance = Math.abs(this.getSlideDistance(-restingX, this.selectedIndex)), positiveResting = this._getClosestResting(restingX, distance, 1), negativeResting = this._getClosestResting(restingX, distance, -1), index = positiveResting.distance < negativeResting.distance ? positiveResting.index : negativeResting.index;
        return index;
    }, proto._getClosestResting = function(restingX, distance, increment) {
        for (var index = this.selectedIndex, minDistance = 1 / 0, condition = this.options.contain && !this.options.wrapAround ? // if contain, keep going if distance is equal to minDistance
        function(d, md) {
            return md >= d;
        } : function(d, md) {
            return md > d;
        }; condition(distance, minDistance) && (index += increment, minDistance = distance, 
        distance = this.getSlideDistance(-restingX, index), null !== distance); ) distance = Math.abs(distance);
        return {
            distance: minDistance,
            // selected was previous index
            index: index - increment
        };
    }, proto.getSlideDistance = function(x, index) {
        var len = this.slides.length, isWrapAround = this.options.wrapAround && len > 1, slideIndex = isWrapAround ? utils.modulo(index, len) : index, slide = this.slides[slideIndex];
        if (!slide) return null;
        // add distance for wrap-around slides
        var wrap = isWrapAround ? this.slideableWidth * Math.floor(index / len) : 0;
        return x - (slide.target + wrap);
    }, proto.dragEndBoostSelect = function() {
        // do not boost if no previousDragX or dragMoveTime
        if (void 0 === this.previousDragX || !this.dragMoveTime || new Date() - this.dragMoveTime > 100) return 0;
        var distance = this.getSlideDistance(-this.dragX, this.selectedIndex), delta = this.previousDragX - this.dragX;
        return distance > 0 && delta > 0 ? 1 : 0 > distance && 0 > delta ? -1 : 0;
    }, proto.staticClick = function(event, pointer) {
        // get clickedCell, if cell was clicked
        var clickedCell = this.getParentCell(event.target), cellElem = clickedCell && clickedCell.element, cellIndex = clickedCell && this.cells.indexOf(clickedCell);
        this.dispatchEvent("staticClick", event, [ pointer, cellElem, cellIndex ]);
    }, proto.onscroll = function() {
        var scroll = getScrollPosition(), scrollMoveX = this.pointerDownScroll.x - scroll.x, scrollMoveY = this.pointerDownScroll.y - scroll.y;
        // cancel click/tap if scroll is too much
        (Math.abs(scrollMoveX) > 3 || Math.abs(scrollMoveY) > 3) && this._pointerDone();
    }, Flickity;
}), /*!
 * Tap listener v2.0.0
 * listens to taps
 * MIT license
 */
/*jshint browser: true, unused: true, undef: true, strict: true */
function(window, factory) {
    // universal module definition
    /*jshint strict: false*/
    /*globals define, module, require */
    "function" == typeof define && define.amd ? // AMD
    define("tap-listener/tap-listener", [ "unipointer/unipointer" ], function(Unipointer) {
        return factory(window, Unipointer);
    }) : "object" == typeof module && module.exports ? module.exports = factory(window, require("unipointer")) : window.TapListener = factory(window, window.Unipointer);
}(window, function(window, Unipointer) {
    // --------------------------  TapListener -------------------------- //
    function TapListener(elem) {
        this.bindTap(elem);
    }
    // inherit Unipointer & EventEmitter
    var proto = TapListener.prototype = Object.create(Unipointer.prototype);
    // -----  ----- //
    /**
     * bind tap event to element
     * @param {Element} elem
     */
    /**
     * pointer up
     * @param {Event} event
     * @param {Event or Touch} pointer
     */
    return proto.bindTap = function(elem) {
        elem && (this.unbindTap(), this.tapElement = elem, this._bindStartEvent(elem, !0));
    }, proto.unbindTap = function() {
        this.tapElement && (this._bindStartEvent(this.tapElement, !0), delete this.tapElement);
    }, proto.pointerUp = function(event, pointer) {
        // ignore emulated mouse up clicks
        if (!this.isIgnoringMouseUp || "mouseup" != event.type) {
            var pointerPoint = Unipointer.getPointerPoint(pointer), boundingRect = this.tapElement.getBoundingClientRect(), scrollX = window.pageXOffset, scrollY = window.pageYOffset, isInside = pointerPoint.x >= boundingRect.left + scrollX && pointerPoint.x <= boundingRect.right + scrollX && pointerPoint.y >= boundingRect.top + scrollY && pointerPoint.y <= boundingRect.bottom + scrollY;
            // set flag for emulated clicks 300ms after touchend
            if (// trigger callback if pointer is inside element
            isInside && this.emitEvent("tap", [ event, pointer ]), "mouseup" != event.type) {
                this.isIgnoringMouseUp = !0;
                // reset flag after 300ms
                var _this = this;
                setTimeout(function() {
                    delete _this.isIgnoringMouseUp;
                }, 400);
            }
        }
    }, proto.destroy = function() {
        this.pointerDone(), this.unbindTap();
    }, TapListener;
}), // prev/next buttons
function(window, factory) {
    // universal module definition
    /* jshint strict: false */
    "function" == typeof define && define.amd ? // AMD
    define("flickity/js/prev-next-button", [ "./flickity", "tap-listener/tap-listener", "fizzy-ui-utils/utils" ], function(Flickity, TapListener, utils) {
        return factory(window, Flickity, TapListener, utils);
    }) : "object" == typeof module && module.exports ? // CommonJS
    module.exports = factory(window, require("./flickity"), require("tap-listener"), require("fizzy-ui-utils")) : // browser global
    factory(window, window.Flickity, window.TapListener, window.fizzyUIUtils);
}(window, function(window, Flickity, TapListener, utils) {
    "use strict";
    // -------------------------- PrevNextButton -------------------------- //
    function PrevNextButton(direction, parent) {
        this.direction = direction, this.parent = parent, this._create();
    }
    // get SVG path movmement
    function getArrowMovements(shape) {
        // use shape as movement if string
        // use shape as movement if string
        return "string" == typeof shape ? shape : "M " + shape.x0 + ",50 L " + shape.x1 + "," + (shape.y1 + 50) + " L " + shape.x2 + "," + (shape.y2 + 50) + " L " + shape.x3 + ",50  L " + shape.x2 + "," + (50 - shape.y2) + " L " + shape.x1 + "," + (50 - shape.y1) + " Z";
    }
    var svgURI = "http://www.w3.org/2000/svg";
    PrevNextButton.prototype = new TapListener(), PrevNextButton.prototype._create = function() {
        // properties
        this.isEnabled = !0, this.isPrevious = -1 == this.direction;
        var leftDirection = this.parent.options.rightToLeft ? 1 : -1;
        this.isLeft = this.direction == leftDirection;
        var element = this.element = document.createElement("button");
        element.className = "flickity-prev-next-button", element.className += this.isPrevious ? " previous" : " next", 
        // prevent button from submitting form http://stackoverflow.com/a/10836076/182183
        element.setAttribute("type", "button"), // init as disabled
        this.disable(), element.setAttribute("aria-label", this.isPrevious ? "previous" : "next");
        // create arrow
        var svg = this.createSVG();
        element.appendChild(svg), // events
        this.on("tap", this.onTap), this.parent.on("select", this.update.bind(this)), this.on("pointerDown", this.parent.childUIPointerDown.bind(this.parent));
    }, PrevNextButton.prototype.activate = function() {
        this.bindTap(this.element), // click events from keyboard
        this.element.addEventListener("click", this), // add to DOM
        this.parent.element.appendChild(this.element);
    }, PrevNextButton.prototype.deactivate = function() {
        // remove from DOM
        this.parent.element.removeChild(this.element), // do regular TapListener destroy
        TapListener.prototype.destroy.call(this), // click events from keyboard
        this.element.removeEventListener("click", this);
    }, PrevNextButton.prototype.createSVG = function() {
        var svg = document.createElementNS(svgURI, "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        var path = document.createElementNS(svgURI, "path"), pathMovements = getArrowMovements(this.parent.options.arrowShape);
        // rotate arrow
        return path.setAttribute("d", pathMovements), path.setAttribute("class", "arrow"), 
        this.isLeft || path.setAttribute("transform", "translate(100, 100) rotate(180) "), 
        svg.appendChild(path), svg;
    }, PrevNextButton.prototype.onTap = function() {
        if (this.isEnabled) {
            this.parent.uiChange();
            var method = this.isPrevious ? "previous" : "next";
            this.parent[method]();
        }
    }, PrevNextButton.prototype.handleEvent = utils.handleEvent, PrevNextButton.prototype.onclick = function() {
        // only allow clicks from keyboard
        var focused = document.activeElement;
        focused && focused == this.element && this.onTap();
    }, // -----  ----- //
    PrevNextButton.prototype.enable = function() {
        this.isEnabled || (this.element.disabled = !1, this.isEnabled = !0);
    }, PrevNextButton.prototype.disable = function() {
        this.isEnabled && (this.element.disabled = !0, this.isEnabled = !1);
    }, PrevNextButton.prototype.update = function() {
        // index of first or last slide, if previous or next
        var slides = this.parent.slides;
        // enable is wrapAround and at least 2 slides
        if (this.parent.options.wrapAround && slides.length > 1) return void this.enable();
        var lastIndex = slides.length ? slides.length - 1 : 0, boundIndex = this.isPrevious ? 0 : lastIndex, method = this.parent.selectedIndex == boundIndex ? "disable" : "enable";
        this[method]();
    }, PrevNextButton.prototype.destroy = function() {
        this.deactivate();
    }, // -------------------------- Flickity prototype -------------------------- //
    utils.extend(Flickity.defaults, {
        prevNextButtons: !0,
        arrowShape: {
            x0: 10,
            x1: 60,
            y1: 50,
            x2: 70,
            y2: 40,
            x3: 30
        }
    }), Flickity.createMethods.push("_createPrevNextButtons");
    var proto = Flickity.prototype;
    // --------------------------  -------------------------- //
    return proto._createPrevNextButtons = function() {
        this.options.prevNextButtons && (this.prevButton = new PrevNextButton(-1, this), 
        this.nextButton = new PrevNextButton(1, this), this.on("activate", this.activatePrevNextButtons));
    }, proto.activatePrevNextButtons = function() {
        this.prevButton.activate(), this.nextButton.activate(), this.on("deactivate", this.deactivatePrevNextButtons);
    }, proto.deactivatePrevNextButtons = function() {
        this.prevButton.deactivate(), this.nextButton.deactivate(), this.off("deactivate", this.deactivatePrevNextButtons);
    }, Flickity.PrevNextButton = PrevNextButton, Flickity;
}), /*!
 * Flickity v2.0.5
 * Touch, responsive, flickable carousels
 *
 * Licensed GPLv3 for open source use
 * or Flickity Commercial License for commercial use
 *
 * http://flickity.metafizzy.co
 * Copyright 2016 Metafizzy
 */
function(window, factory) {
    // universal module definition
    /* jshint strict: false */
    "function" == typeof define && define.amd ? // AMD
    define("flickity/js/index", [ "./flickity", "./drag", "./prev-next-button" ], factory) : "object" == typeof module && module.exports && (// CommonJS
    module.exports = factory(require("./flickity"), require("./drag"), require("./prev-next-button")));
}(window, function(Flickity) {
    /*jshint strict: false*/
    return Flickity;
}), /*!
 * Flickity asNavFor v2.0.1
 * enable asNavFor for Flickity
 */
/*jshint browser: true, undef: true, unused: true, strict: true*/
function(window, factory) {
    // universal module definition
    /*jshint strict: false */
    /*globals define, module, require */
    "function" == typeof define && define.amd ? // AMD
    define("flickity-as-nav-for/as-nav-for", [ "flickity/js/index", "fizzy-ui-utils/utils" ], factory) : "object" == typeof module && module.exports ? module.exports = factory(require("flickity"), require("fizzy-ui-utils")) : window.Flickity = factory(window.Flickity, window.fizzyUIUtils);
}(window, function(Flickity, utils) {
    function lerp(a, b, t) {
        return (b - a) * t + a;
    }
    // -------------------------- asNavFor prototype -------------------------- //
    // Flickity.defaults.asNavFor = null;
    Flickity.createMethods.push("_createAsNavFor");
    var proto = Flickity.prototype;
    // -----  ----- //
    return proto._createAsNavFor = function() {
        this.on("activate", this.activateAsNavFor), this.on("deactivate", this.deactivateAsNavFor), 
        this.on("destroy", this.destroyAsNavFor);
        var asNavForOption = this.options.asNavFor;
        if (asNavForOption) {
            // HACK do async, give time for other flickity to be initalized
            var _this = this;
            setTimeout(function() {
                _this.setNavCompanion(asNavForOption);
            });
        }
    }, proto.setNavCompanion = function(elem) {
        elem = utils.getQueryElement(elem);
        var companion = Flickity.data(elem);
        // stop if no companion or companion is self
        if (companion && companion != this) {
            this.navCompanion = companion;
            // companion select
            var _this = this;
            this.onNavCompanionSelect = function() {
                _this.navCompanionSelect();
            }, companion.on("select", this.onNavCompanionSelect), // click
            this.on("staticClick", this.onNavStaticClick), this.navCompanionSelect(!0);
        }
    }, proto.navCompanionSelect = function(isInstant) {
        if (this.navCompanion) {
            // select slide that matches first cell of slide
            var selectedCell = this.navCompanion.selectedCells[0], firstIndex = this.navCompanion.cells.indexOf(selectedCell), lastIndex = firstIndex + this.navCompanion.selectedCells.length - 1, selectIndex = Math.floor(lerp(firstIndex, lastIndex, this.navCompanion.cellAlign));
            // stop if companion has more cells than this one
            if (this.selectCell(selectIndex, !1, isInstant), // set nav selected class
            this.removeNavSelectedElements(), !(selectIndex >= this.cells.length)) {
                var selectedCells = this.cells.slice(firstIndex, lastIndex + 1);
                this.navSelectedElements = selectedCells.map(function(cell) {
                    return cell.element;
                }), this.changeNavSelectedClass("add");
            }
        }
    }, proto.changeNavSelectedClass = function(method) {
        this.navSelectedElements.forEach(function(navElem) {
            navElem.classList[method]("is-nav-selected");
        });
    }, proto.activateAsNavFor = function() {
        this.navCompanionSelect(!0);
    }, proto.removeNavSelectedElements = function() {
        this.navSelectedElements && (this.changeNavSelectedClass("remove"), delete this.navSelectedElements);
    }, proto.onNavStaticClick = function(event, pointer, cellElement, cellIndex) {
        "number" == typeof cellIndex && this.navCompanion.selectCell(cellIndex);
    }, proto.deactivateAsNavFor = function() {
        this.removeNavSelectedElements();
    }, proto.destroyAsNavFor = function() {
        this.navCompanion && (this.navCompanion.off("select", this.onNavCompanionSelect), 
        this.off("staticClick", this.onNavStaticClick), delete this.navCompanion);
    }, Flickity;
});