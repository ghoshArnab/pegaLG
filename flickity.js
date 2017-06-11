window.EvEmitter = function () {
    var proto = EvEmitter.prototype;
    proto.on = function (eventName, listener) {
        var events, listeners;
        if (eventName && listener) {
            events = this._events = this._events || {};
            listeners = events[eventName] = events[eventName] || []; - 1 == listeners.indexOf(listener) && listeners.push(listener);
            return this;
        }
    };
    proto.off = function (eventName, listener) {
        var index, listeners = this._events && this._events[eventName];
        if (listeners && listeners.length) {
            index = listeners.indexOf(listener); - 1 != index && listeners.splice(index, 1);
            return this;
        }
    };
    proto.emitEvent = function (eventName, args) {
        var i, listener, onceListeners, isOnce, listeners = this._events && this._events[eventName];
        if (listeners && listeners.length) {
            i = 0;
            listener = listeners[i];
            args = args || [];
            onceListeners = this._onceEvents && this._onceEvents[eventName];
            for (; listener;) {
                isOnce = onceListeners && onceListeners[listener];
                if (isOnce) {
                    this.off(eventName, listener);
                    delete onceListeners[listener];
                }
                listener.apply(this, args);
                i += isOnce ? 0 : 1;
                listener = listeners[i];
            }
            return this;
        }
    };
    return EvEmitter;
};

window.EvEmitter();

! function (window, factory) {
    "use strict";
    window.getSize = factory();
}(window, function () {
    "use strict";
    var measurements, measurementsLength;

    function getStyleSize(value) {
        var num = parseFloat(value),
            isValid = -1 == value.indexOf("%") && !isNaN(num);
        return isValid && num;
    }

    function noop() {}
    measurements = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "marginLeft", "marginRight", "marginTop", "marginBottom", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth"];
    measurementsLength = measurements.length;

    function getSize(elem) {
        var style, size, isBorderBox, i, measurement, value, num, paddingWidth, paddingHeight, marginWidth, marginHeight, borderWidth, borderHeight, isBorderBoxSizeOuter, styleWidth, styleHeight;
        "string" == typeof elem && (elem = document.querySelector(elem));
        if (elem && "object" == typeof elem && elem.nodeType) {
            style = getComputedStyle(elem);
            size = {};
            size.width = elem.offsetWidth;
            size.height = elem.offsetHeight;
            isBorderBox = size.isBorderBox = "border-box" == style.boxSizing;
            for (i = 0; measurementsLength > i; i++) {
                measurement = measurements[i];
                value = style[measurement];
                num = parseFloat(value);
                size[measurement] = isNaN(num) ? 0 : num;
            }
            paddingWidth = size.paddingLeft + size.paddingRight;
            paddingHeight = size.paddingTop + size.paddingBottom;
            marginWidth = size.marginLeft + size.marginRight;
            marginHeight = size.marginTop + size.marginBottom;
            borderWidth = size.borderLeftWidth + size.borderRightWidth;
            borderHeight = size.borderTopWidth + size.borderBottomWidth;
            isBorderBoxSizeOuter = isBorderBox;
            styleWidth = getStyleSize(style.width);
            styleWidth !== !1 && (size.width = styleWidth + (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth));
            styleHeight = getStyleSize(style.height);
            styleHeight !== !1 && (size.height = styleHeight + (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight));
            size.innerWidth = size.width - (paddingWidth + borderWidth);
            size.innerHeight = size.height - (paddingHeight + borderHeight);
            size.outerWidth = size.width + marginWidth;
            size.outerHeight = size.height + marginHeight;
            return size;
        }
    }
    return getSize;
});

! function (window, factory) {
    window.fizzyUIUtils = factory(window);
}(window, function (window) {
    var utils = {};
    utils.extend = function (a, b) {
        for (var prop in b) a[prop] = b[prop];
        return a;
    };
    utils.makeArray = function (obj) {
        var i, ary = [];
        if (obj && "number" == typeof obj.length)
            for (i = 0; i < obj.length; i++) ary.push(obj[i]);
        else ary.push(obj);
        return ary;
    };
    utils.getQueryElement = function (elem) {
        return "string" == typeof elem ? document.querySelector(elem) : elem;
    };
    utils.handleEvent = function (event) {
        var method = "on" + event.type;
        this[method] && this[method](event);
    };
    return utils;
});


// arnab
var baseUtils = (function () {
    generateArray = function (obj) {
        var i, ary = [];
        if (obj && "number" == typeof obj.length)
            for (i = 0; i < obj.length; i++) ary.push(obj[i]);
        else ary.push(obj);
        return ary;
    };

    return {
        filter: function (elems, selector) {
            elems = generateArray(elems);
            var ffElems = [];
            elems.forEach(function (elem) {
                var childElems, i;
                if (elem instanceof HTMLElement)
                    if (selector) {
                        ffElems.push(elem);
                        childElems = elem.querySelectorAll(selector);
                        for (i = 0; i < childElems.length; i++) ffElems.push(childElems[i]);
                    } else ffElems.push(elem);
            });
            return ffElems;
        },
        render: function (WidgetClass, namespace) {
            document.addEventListener("DOMContentLoaded", function () {
                var dataAttr = "data-" + namespace,
                    dataAttrElems = document.querySelectorAll("[" + dataAttr + "]"),
                    jsDashElems = document.querySelectorAll(".js-" + namespace),
                    elems = generateArray(dataAttrElems).concat(generateArray(jsDashElems)),
                    dataOptionsAttr = dataAttr + "-options";
                elems.forEach(function (elem) {
                    var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr),
                        options = attr && JSON.parse(attr);
                    new WidgetClass(elem, options);
                });
            });
        }
    }
}());




! function (window, factory) {
    window.Flickity = window.Flickity || {};
    window.Flickity.Cell = factory(window, window.getSize);
}(window, function (window, getSize) {
    function Cell(elem, parent) {
        this.element = elem;
        this.parent = parent;
        this.create();
    }
    var proto = Cell.prototype;
    proto.create = function () {
        this.element.style.position = "absolute";
        this.x = 0;
        this.shift = 0;
    };
    proto.destroy = function () {
        this.element.style.position = "";
        var side = this.parent.originSide;
        this.element.style[side] = "";
    };
    proto.getSize = function () {
        this.size = getSize(this.element);
    };
    proto.setPosition = function (x) {
        this.x = x;
        this.updateTarget();
        this.renderPosition(x);
    };
    proto.updateTarget = proto.setDefaultTarget = function () {
        var marginProperty = "left" == this.parent.originSide ? "marginLeft" : "marginRight";
        this.target = this.x + this.size[marginProperty] + this.size.width * this.parent.cellAlign;
    };
    proto.renderPosition = function (x) {
        var side = this.parent.originSide;
        this.element.style[side] = Math.round(x) + "px";
    };
    proto.wrapShift = function (shift) {
        this.shift = shift;
        this.renderPosition(this.x + this.parent.slideableWidth * shift);
    };
    proto.remove = function () {
        this.element.parentNode.removeChild(this.element);
    };
    return Cell;
});

! function (window, factory) {
    window.Flickity.Slide = factory();
}(window, function () {
    "use strict";

    function Slide(parent) {
        this.parent = parent;
        this.isOriginLeft = "left" == parent.originSide;
        this.cells = [];
        this.outerWidth = 0;
        this.height = 0;
    }
    var proto = Slide.prototype;
    proto.addCell = function (cell) {
        this.cells.push(cell);
        this.outerWidth += cell.size.outerWidth;
        this.height = Math.max(cell.size.outerHeight, this.height);
        if (1 == this.cells.length) {
            this.x = cell.x;
            var beginMargin = this.isOriginLeft ? "marginLeft" : "marginRight";
            this.firstMargin = cell.size[beginMargin];
        }
    };
    proto.updateTarget = function () {
        var endMargin = this.isOriginLeft ? "marginRight" : "marginLeft",
            lastCell = this.cells[this.cells.length - 1],
            lastMargin = lastCell ? lastCell.size[endMargin] : 0,
            slideWidth = this.outerWidth - (this.firstMargin + lastMargin);
        this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
    };
    proto.select = function () {
        this.changeSelectedClass("add");
    };
    proto.unselect = function () {
        this.changeSelectedClass("remove");
    };
    proto.changeSelectedClass = function (method) {
        this.cells.forEach(function (cell) {
            cell.element.classList[method]("is-selected");
        });
    };
    proto.getCellElements = function () {
        return this.cells.map(function (cell) {
            return cell.element;
        });
    };
    return Slide;
});

! function (window, factory) {
    window.Flickity.animatePrototype = factory(window, window.fizzyUIUtils);
}(window, function (window, utils) {
    var proto,
        requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame,
        lastTime = 0;
    requestAnimationFrame || (requestAnimationFrame = function (callback) {
        var currTime = new Date().getTime(),
            timeToCall = Math.max(0, 16 - (currTime - lastTime)),
            id = setTimeout(callback, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    });
    proto = {};
    proto.startAnimation = function () {
        if (!this.isAnimating) {
            this.isAnimating = !0;
            this.restingFrames = 0;
            this.animate();
        }
    };
    proto.animate = function () {
        var previousX, _this;
        this.applyDragForce();
        this.applySelectedAttraction();
        previousX = this.x;
        this.integratePhysics();
        this.positionSlider();
        this.settle(previousX);
        if (this.isAnimating) {
            _this = this;
            requestAnimationFrame(function () {
                _this.animate();
            });
        }
    };
    proto.positionSlider = function () {
        var value, firstSlide, positionX, progress, x = this.x;
        x += this.cursorPosition;
        x = this.options.rightToLeft && "transform" ? -x : x;
        value = Math.round(x) + "px";
        this.slider.style["transform"] = this.isAnimating ? "translate3d(" + value + ",0,0)" : "translateX(" + value + ")";
        firstSlide = this.slides[0];
        if (firstSlide) {
            positionX = -this.x - firstSlide.target;
            progress = positionX / this.slidesWidth;
            this.dispatchEvent("scroll", null, [progress, positionX]);
        }
    };
    proto.positionSliderAtSelected = function () {
        if (this.cells.length) {
            this.x = -this.selectedSlide.target;
            this.positionSlider();
        }
    };
    proto.settle = function (previousX) {
        this.isPointerDown || Math.round(100 * this.x) != Math.round(100 * previousX) || this.restingFrames++;
        if (this.restingFrames > 2) {
            this.isAnimating = !1;
            delete this.isFreeScrolling;
            this.positionSlider();
            this.dispatchEvent("settle");
        }
    };
    proto.shiftWrapCells = function (x) {
        var afterGap, beforeGap = this.cursorPosition + x;
        this._shiftCells(this.beforeShiftCells, beforeGap, -1);
        afterGap = this.size.innerWidth - (x + this.slideableWidth + this.cursorPosition);
        this._shiftCells(this.afterShiftCells, afterGap, 1);
    };
    proto._shiftCells = function (cells, gap, shift) {
        var i, cell, cellShift;
        for (i = 0; i < cells.length; i++) {
            cell = cells[i];
            cellShift = gap > 0 ? shift : 0;
            cell.wrapShift(cellShift);
            gap -= cell.size.outerWidth;
        }
    };
    proto._unshiftCells = function (cells) {
        if (cells && cells.length)
            for (var i = 0; i < cells.length; i++) cells[i].wrapShift(0);
    };
    proto.integratePhysics = function () {
        this.x += this.velocity;
        this.velocity *= 0.8;
    };
    proto.applyForce = function (force) {
        this.velocity += force;
    };
    proto.getRestingPosition = function () {
        return this.x + this.velocity / 0.2;
    };
    proto.applyDragForce = function () {
        var dragVelocity, dragForce;
        if (this.isPointerDown) {
            dragVelocity = this.dragX - this.x;
            dragForce = dragVelocity - this.velocity;
            this.applyForce(dragForce);
        }
    };
    proto.applySelectedAttraction = function () {
        var distance, force;
        if (!this.isPointerDown && !this.isFreeScrolling && this.cells.length) {
            distance = -1 * this.selectedSlide.target - this.x;
            force = distance * this.options.selectedAttraction;
            this.applyForce(force);
        }
    };
    return proto;
});

! function (window, factory) {
    var _Flickity = window.Flickity;
    window.Flickity = factory(window, window.EvEmitter, window.getSize, window.fizzyUIUtils, _Flickity.Cell, _Flickity.Slide, _Flickity.animatePrototype);
}(window, function (window, EvEmitter, getSize, utils, Cell, Slide, animatePrototype) {
    var GUID, instances, proto, cellAlignShorthands, jQuery = window.jQuery;
    window.getComputedStyle, window.console;

    function moveElements(elems, toElem) {
        elems = utils.makeArray(elems);
        for (; elems.length;) toElem.appendChild(elems.shift());
    }
    GUID = 0;
    instances = {};

    function Flickity(element, options) {
        var instance, queryElement = utils.getQueryElement(element);
        this.element = queryElement;
        if (this.element.flickityGUID) {
            instance = instances[this.element.flickityGUID];
            instance.option(options);
            return instance;
        }
        jQuery && (this.$element = jQuery(this.element));
        this.options = utils.extend({}, this.constructor.defaults);
        this.option(options);
        this._create();
    }
    Flickity.defaults = {
        accessibility: !0,
        cellAlign: "center",
        resize: !0,
        selectedAttraction: .025,
        setGallerySize: !0
    };
    Flickity.createMethods = [];
    proto = Flickity.prototype;
    utils.extend(proto, EvEmitter.prototype);
    proto._create = function () {
        var id = this.guid = ++GUID;
        this.element.flickityGUID = id;
        instances[id] = this;
        this.selectedIndex = 0;
        this.restingFrames = 0;
        this.x = 0;
        this.velocity = 0;
        this.originSide = this.options.rightToLeft ? "right" : "left";
        this.viewport = document.createElement("div");
        this.viewport.className = "flickity-viewport";
        this._createSlider();
        this.options.resize && window.addEventListener("resize", this);
        Flickity.createMethods.forEach(function (method) {
            this[method]();
        }, this);
        this.activate();
    };
    proto.option = function (opts) {
        utils.extend(this.options, opts);
    };
    proto.activate = function () {
        var cellElems, index, initialIndex;
        if (!this.isActive) {
            this.isActive = !0;
            this.element.classList.add("flickity-enabled");
            this.options.rightToLeft && this.element.classList.add("flickity-rtl");
            this.getSize();
            cellElems = this._filterFindCellElements(this.element.children);
            moveElements(cellElems, this.slider);
            this.viewport.appendChild(this.slider);
            this.element.appendChild(this.viewport);
            this.cells = this._makeCells(this.slider.children);
        this.positionCells();
        this._getWrapShiftCells();
        this.setGallerySize();
            if (this.options.accessibility) {
                this.element.tabIndex = 0;
                this.element.addEventListener("keydown", this);
            }
            this.emitEvent("activate");
            initialIndex = this.options.initialIndex;
            index = this.isInitActivated ? this.selectedIndex : void 0 !== initialIndex && this.cells[initialIndex] ? initialIndex : 0;
            this.select(index, !1, !0);
            this.isInitActivated = !0;
        }
    };
    proto._createSlider = function () {
        var slider = document.createElement("div");
        slider.className = "flickity-slider";
        slider.style[this.originSide] = 0;
        this.slider = slider;
    };
    proto._filterFindCellElements = function (elems) {
        return baseUtils.filter(elems, this.options.cellSelector);
    };
    proto._makeCells = function (elems) {
        var cellElems = this._filterFindCellElements(elems),
            cells = cellElems.map(function (cellElem) {
                return new Cell(cellElem, this);
            }, this);
        return cells;
    };
    proto.getLastSlide = function () {
        return this.slides[this.slides.length - 1];
    };
    proto.positionCells = function () {
        this._sizeCells(this.cells);
        this._positionCells(0);
    };
    proto._positionCells = function (index) {
        var cellX, startCell, len, i, cell;
        index = index || 0;
        this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
        cellX = 0;
        if (index > 0) {
            startCell = this.cells[index - 1];
            cellX = startCell.x + startCell.size.outerWidth;
        }
        len = this.cells.length;
        for (i = index; len > i; i++) {
            cell = this.cells[i];
            cell.setPosition(cellX);
            cellX += cell.size.outerWidth;
            this.maxCellHeight = Math.max(cell.size.outerHeight, this.maxCellHeight);
        }
        this.slideableWidth = cellX;
        this.updateSlides();
        this._containSlides();
        this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
    };
    proto._sizeCells = function (cells) {
        cells.forEach(function (cell) {
            cell.getSize();
        });
    };
    proto.updateSlides = function () {
        var slide, isOriginLeft, nextMargin, canCellFit;
        this.slides = [];
        if (this.cells.length) {
            slide = new Slide(this);
            this.slides.push(slide);
            isOriginLeft = "left" == this.originSide;
            nextMargin = isOriginLeft ? "marginRight" : "marginLeft";
            canCellFit = this._getCanCellFit();
            this.cells.forEach(function (cell, i) {
                if (slide.cells.length) {
                    var slideWidth = slide.outerWidth - slide.firstMargin + (cell.size.outerWidth - cell.size[nextMargin]);
                    if (canCellFit.call(this, i, slideWidth)) slide.addCell(cell);
                    else {
                        slide.updateTarget();
                        slide = new Slide(this);
                        this.slides.push(slide);
                        slide.addCell(cell);
                    }
                } else slide.addCell(cell);
            }, this);
            slide.updateTarget();
            this.updateSelectedSlide();
        }
    };
    proto._getCanCellFit = function () {
        var number, percentMatch, percent, groupCells = this.options.groupCells;
        if (!groupCells) return function () {
            return !1;
        };
        if ("number" == typeof groupCells) {
            number = parseInt(groupCells, 10);
            return function (i) {
                return i % number !== 0;
            };
        }
        percentMatch = "string" == typeof groupCells && groupCells.match(/^(\d+)%$/);
        percent = percentMatch ? parseInt(percentMatch[1], 10) / 100 : 1;
        return function (i, slideWidth) {
            return slideWidth <= (this.size.innerWidth + 1) * percent;
        };
    };
    proto._init = proto.reposition = function () {
        this.positionCells();
        this.positionSliderAtSelected();
    };
    proto.getSize = function () {
        this.size = getSize(this.element);
        this.setCellAlign();
        this.cursorPosition = this.size.innerWidth * this.cellAlign;
    };
    cellAlignShorthands = {
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
    proto.setCellAlign = function () {
        var shorthand = cellAlignShorthands[this.options.cellAlign];
        this.cellAlign = shorthand ? shorthand[this.originSide] : this.options.cellAlign;
    };
    proto.setGallerySize = function () {
        if (this.options.setGallerySize) {
            var height = this.options.adaptiveHeight && this.selectedSlide ? this.selectedSlide.height : this.maxCellHeight;
            this.viewport.style.height = height + "px";
        }
    };
    proto._getWrapShiftCells = function () {
        var gapX, cellIndex;
    };
    proto._getGapCells = function (gapX, cellIndex, increment) {
        for (var cell, cells = []; gapX > 0;) {
            cell = this.cells[cellIndex];
            if (!cell) break;
            cells.push(cell);
            cellIndex += increment;
            gapX -= cell.size.outerWidth;
        }
        return cells;
    };
    proto._containSlides = function () {
        var isRightToLeft, beginMargin, endMargin, contentWidth, isContentSmaller, beginBound, endBound;
        if (this.options.contain && this.cells.length) {
            isRightToLeft = this.options.rightToLeft;
            beginMargin = isRightToLeft ? "marginRight" : "marginLeft";
            endMargin = isRightToLeft ? "marginLeft" : "marginRight";
            contentWidth = this.slideableWidth - this.cells[this.cells.length - 1].size[endMargin];


            isContentSmaller = contentWidth < this.element.offsetWidth;
            beginBound = this.cursorPosition + this.cells[0].size[beginMargin];
            endBound = contentWidth - this.element.offsetWidth * (1 - this.cellAlign);
            this.slides.forEach(function (slide) {
                if (isContentSmaller) slide.target = contentWidth * this.cellAlign;
                else {
                    slide.target = Math.max(slide.target, beginBound);
                    slide.target = Math.min(slide.target, endBound);
                }
            }, this);
        }
    };
    proto.dispatchEvent = function (type, event, args) {
        var emitArgs = event ? [event].concat(args) : args;
        this.emitEvent(type, emitArgs);
    };
    proto.select = function (index) {
        if (this.isActive) {
            index = parseInt(index, 10);
            if (this.slides[index]) {
                this.selectedIndex = index;
                this.updateSelectedSlide();
                this.startAnimation();
                this.options.adaptiveHeight && this.setGallerySize();
                this.dispatchEvent("select");
                this.dispatchEvent("cellSelect");
            }
        }
    };
    proto.previous = function () {
        this.select(this.selectedIndex - 1);
    };
    proto.next = function () {
        this.select(this.selectedIndex + 1);
    };
    proto.updateSelectedSlide = function () {
        var slide = this.slides[this.selectedIndex];
        if (slide) {
            this.unselectSelectedSlide();
            this.selectedSlide = slide;
            slide.select();
            this.selectedCells = slide.cells;
            this.selectedElements = slide.getCellElements();
            this.selectedCell = slide.cells[0];
            this.selectedElement = this.selectedElements[0];
        }
    };
    proto.unselectSelectedSlide = function () {
        this.selectedSlide && this.selectedSlide.changeSelectedClass("remove");
    };
    proto.selectCell = function (value) {
        var cell, i, slide, index;
        if ("number" == typeof value) cell = this.cells[value];
        else {
            "string" == typeof value && (value = this.element.querySelector(value));
            cell = this.getCell(value);
        }
        for (i = 0; cell && i < this.slides.length; i++) {
            slide = this.slides[i];
            index = slide.cells.indexOf(cell);
            if (-1 != index) {
                this.select(i);
                return;
            }
        }
    };
    proto.getCell = function (elem) {
        var i, cell;
        for (i = 0; i < this.cells.length; i++) {
            cell = this.cells[i];
            if (cell.element == elem) return cell;
        }
    };
    proto.getCells = function (elems) {
        elems = utils.makeArray(elems);
        var cells = [];
        elems.forEach(function (elem) {
            var cell = this.getCell(elem);
            cell && cells.push(cell);
        }, this);
        return cells;
    };
    proto.getParentCell = function (elem) {
        var cell = this.getCell(elem);
        return cell ? cell : this.getCell(elem.parentNode);
    };
    proto.childUIPointerDown = function (event) {
        this.emitEvent("childUIPointerDown", [event]);
    };
    proto.resize = function () {
        if (this.isActive) {
            this.getSize();
            this.positionCells();
            this._getWrapShiftCells();
            this.setGallerySize();
            this.emitEvent("resize");
            var selectedElement = this.selectedElements && this.selectedElements[0];
            this.selectCell(selectedElement, !1, !0);
        }
    };
    proto.onkeydown = function (event) {
        var leftMethod, rightMethod;
        if (this.options.accessibility && (!document.activeElement || document.activeElement == this.element))
            if (37 == event.keyCode) {
                leftMethod = this.options.rightToLeft ? "next" : "previous";
                this.emitEvent("uiChange");
                this[leftMethod]();
            } else if (39 == event.keyCode) {
            rightMethod = this.options.rightToLeft ? "previous" : "next";
            this.emitEvent("uiChange");
            this[rightMethod]();
        }
    };
    proto.deactivate = function () {
        if (this.isActive) {
            this.element.classList.remove("flickity-enabled");
            this.element.classList.remove("flickity-rtl");
            this.cells.forEach(function (cell) {
                cell.destroy();
            });
            this.unselectSelectedSlide();
            this.element.removeChild(this.viewport);
            moveElements(this.slider.children, this.element);
            if (this.options.accessibility) {
                this.element.removeAttribute("tabIndex");
                this.element.removeEventListener("keydown", this);
            }
            this.isActive = !1;
            this.emitEvent("deactivate");
        }
    };
    proto.destroy = function () {
        this.deactivate();
        window.removeEventListener("resize", this);
        this.emitEvent("destroy");
        jQuery && this.$element && jQuery.removeData(this.element, "flickity");
        delete this.element.flickityGUID;
        delete instances[this.guid];
    };
    utils.extend(proto, animatePrototype);
    Flickity.data = function (elem) {
        elem = utils.getQueryElement(elem);
        var id = elem && elem.flickityGUID;
        return id && instances[id];
    };
    baseUtils.render(Flickity, "flickity");
    Flickity.Cell = Cell;
    return Flickity;
});

! function (window, factory) {
    window.Unipointer = factory(window, window.EvEmitter);
}(window, function (window, EvEmitter) {
    var proto, postStartEvents;

    function noop() {}

    function Unipointer() {}
    proto = Unipointer.prototype = Object.create(EvEmitter.prototype);
    proto._bindStartEvent = function (elem, isBind) {
        isBind = void 0 === isBind ? !0 : !!isBind;
        var bindMethod = isBind ? "addEventListener" : "removeEventListener";
        elem[bindMethod]("mousedown", this);
        elem[bindMethod]("touchstart", this);
    };
    proto.handleEvent = function (event) {
        var method = "on" + event.type;
        this[method] && this[method](event);
    };
    proto.getTouch = function (touches) {
        var i, touch;
        for (i = 0; i < touches.length; i++) {
            touch = touches[i];
            if (touch.identifier == this.pointerIdentifier) return touch;
        }
    };
    proto.onmousedown = function (event) {
        var button = event.button;
        button && 0 !== button && 1 !== button || this._pointerDown(event, event);
    };
    proto.ontouchstart = function (event) {
        this._pointerDown(event, event.changedTouches[0]);
    };
    proto._pointerDown = function (event, pointer) {
        if (!this.isPointerDown) {
            this.isPointerDown = !0;
            this.pointerIdentifier = void 0 !== pointer.pointerId ? pointer.pointerId : pointer.identifier;
            this.pointerDown(event, pointer);
        }
    };
    proto.pointerDown = function (event, pointer) {
        this._bindPostStartEvents(event);
        this.emitEvent("pointerDown", [event, pointer]);
    };
    postStartEvents = {
        mousedown: ["mousemove", "mouseup"],
        touchstart: ["touchmove", "touchend", "touchcancel"],
        pointerdown: ["pointermove", "pointerup", "pointercancel"]
    };
    proto._bindPostStartEvents = function (event) {
        if (event) {
            var events = postStartEvents[event.type];
            events.forEach(function (eventName) {
                window.addEventListener(eventName, this);
            }, this);
            this._boundPointerEvents = events;
        }
    };
    proto._unbindPostStartEvents = function () {
        if (this._boundPointerEvents) {
            this._boundPointerEvents.forEach(function (eventName) {
                window.removeEventListener(eventName, this);
            }, this);
            delete this._boundPointerEvents;
        }
    };
    proto.onmousemove = function (event) {
        this._pointerMove(event, event);
    };
    proto.ontouchmove = function (event) {
        var touch = this.getTouch(event.changedTouches);
        touch && this._pointerMove(event, touch);
    };
    proto._pointerMove = function (event, pointer) {
        this.pointerMove(event, pointer);
    };
    proto.pointerMove = function (event, pointer) {
        this.emitEvent("pointerMove", [event, pointer]);
    };
    proto.onmouseup = function (event) {
        this._pointerUp(event, event);
    };
    proto.ontouchend = function (event) {
        var touch = this.getTouch(event.changedTouches);
        touch && this._pointerUp(event, touch);
    };
    proto._pointerUp = function (event, pointer) {
        this._pointerDone();
        this.pointerUp(event, pointer);
    };
    proto._pointerDone = function () {
        this.isPointerDown = !1;
        delete this.pointerIdentifier;
        this._unbindPostStartEvents();
        this.pointerDone();
    };
    proto.pointerDone = noop;
    proto.ontouchcancel = function (event) {
        var touch = this.getTouch(event.changedTouches);
        touch && this._pointerCancel(event, touch);
    };
    proto._pointerCancel = function (event, pointer) {
        this._pointerDone();
        this.pointerCancel(event, pointer);
    };
    proto.pointerCancel = function (event, pointer) {
        this.emitEvent("pointerCancel", [event, pointer]);
    };
    Unipointer.getPointerPoint = function (pointer) {
        return {
            x: pointer.pageX,
            y: pointer.pageY
        };
    };
    return Unipointer;
});

! function (window, factory) {
    window.Unidragger = factory(window, window.Unipointer);
}(window, function (window, Unipointer) {
    var proto, navigator;

    function noop() {}

    function Unidragger() {}
    proto = Unidragger.prototype = Object.create(Unipointer.prototype);
    navigator = window.navigator;
    proto._bindHandles = function (isBind) {
        var binderExtra, bindMethod, i, handle;
        isBind = void 0 === isBind ? !0 : !!isBind;
        binderExtra = navigator.pointerEnabled ? function (handle) {
            handle.style.touchAction = isBind ? "none" : "";
        } : noop;
        bindMethod = isBind ? "addEventListener" : "removeEventListener";
        for (i = 0; i < this.handles.length; i++) {
            handle = this.handles[i];
            this._bindStartEvent(handle, isBind);
            binderExtra(handle);
            handle[bindMethod]("click", this);
        }
    };
    proto._dragPointerDown = function (event, pointer) {
        this.pointerDownPoint = Unipointer.getPointerPoint(pointer);
        var canPreventDefault = this.canPreventDefaultOnPointerDown(event, pointer);
        canPreventDefault && event.preventDefault();
    };
    proto.canPreventDefaultOnPointerDown = function (event) {
        return "SELECT" != event.target.nodeName;
    };
    proto.pointerMove = function (event, pointer) {
        var moveVector = this._dragPointerMove(event, pointer);
        this.emitEvent("pointerMove", [event, pointer, moveVector]);
        this._dragMove(event, pointer, moveVector);
    };
    proto._dragPointerMove = function (event, pointer) {
        var movePoint = Unipointer.getPointerPoint(pointer),
            moveVector = {
                x: movePoint.x - this.pointerDownPoint.x,
                y: movePoint.y - this.pointerDownPoint.y
            };
        !this.isDragging && this.hasDragStarted(moveVector) && this._dragStart(event, pointer);
        return moveVector;
    };
    proto.hasDragStarted = function (moveVector) {
        return Math.abs(moveVector.x) > 3 || Math.abs(moveVector.y) > 3;
    };
    proto.pointerUp = function (event, pointer) {
        this.emitEvent("pointerUp", [event, pointer]);
        this._dragPointerUp(event, pointer);
    };
    proto._dragPointerUp = function (event, pointer) {
        this.isDragging ? this._dragEnd(event, pointer) : this._staticClick(event, pointer);
    };
    proto._dragStart = function (event, pointer) {
        this.isDragging = !0;
        this.dragStartPoint = Unipointer.getPointerPoint(pointer);
        this.isPreventingClicks = !0;
        this.dragStart(event, pointer);
    };
    proto.dragStart = function (event, pointer) {
        this.emitEvent("dragStart", [event, pointer]);
    };
    proto._dragMove = function (event, pointer, moveVector) {
        this.isDragging && this.dragMove(event, pointer, moveVector);
    };
    proto.dragMove = function (event, pointer, moveVector) {
        event.preventDefault();
        this.emitEvent("dragMove", [event, pointer, moveVector]);
    };
    proto._dragEnd = function (event, pointer) {
        this.isDragging = !1;
        setTimeout(function () {
            delete this.isPreventingClicks;
        }.bind(this));
        this.dragEnd(event, pointer);
    };
    proto.dragEnd = function (event, pointer) {
        this.emitEvent("dragEnd", [event, pointer]);
    };
    proto.onclick = function (event) {
        this.isPreventingClicks && event.preventDefault();
    };
    proto._staticClick = function (event, pointer) {
        if (!this.isIgnoringMouseUp || "mouseup" != event.type) {
            var nodeName = event.target.nodeName;
            ("INPUT" == nodeName || "TEXTAREA" == nodeName) && event.target.focus();
            this.staticClick(event, pointer);
            if ("mouseup" != event.type) {
                this.isIgnoringMouseUp = !0;
                setTimeout(function () {
                    delete this.isIgnoringMouseUp;
                }.bind(this), 400);
            }
        }
    };
    proto.staticClick = function (event, pointer) {
        this.emitEvent("staticClick", [event, pointer]);
    };
    Unidragger.getPointerPoint = Unipointer.getPointerPoint;
    return Unidragger;
});

! function (window, factory) {
    window.Flickity = factory(window, window.Flickity, window.Unidragger, window.fizzyUIUtils);
}(window, function (window, Flickity, Unidragger, utils) {
    var proto, isTouch, isTouchmoveScrollCanceled, cursorNodes, clickTypes, touchStartEvents, focusNodes;
    utils.extend(Flickity.defaults, {
        draggable: !0,
        dragThreshold: 3
    });
    Flickity.createMethods.push("_createDrag");
    proto = Flickity.prototype;
    utils.extend(proto, Unidragger.prototype);
    isTouch = "createTouch" in document;
    isTouchmoveScrollCanceled = !1;
    proto._createDrag = function () {
        this.on("activate", this.bindDrag);
        this.on("uiChange", this._uiChangeDrag);
        this.on("childUIPointerDown", this._childUIPointerDownDrag);
        this.on("deactivate", this.unbindDrag);
        if (isTouch && !isTouchmoveScrollCanceled) {
            window.addEventListener("touchmove", function () {});
            isTouchmoveScrollCanceled = !0;
        }
    };
    proto.bindDrag = function () {
        if (this.options.draggable && !this.isDragBound) {
            this.element.classList.add("is-draggable");
            this.handles = [this.viewport];
            this._bindHandles(!0);
            this.isDragBound = !0;
        }
    };
    proto.unbindDrag = function () {
        if (this.isDragBound) {
            this.element.classList.remove("is-draggable");
            this._bindHandles(!1);
            delete this.isDragBound;
        }
    };
    proto._uiChangeDrag = function () {
        delete this.isFreeScrolling;
    };
    proto._childUIPointerDownDrag = function (event) {
        event.preventDefault();
        this.pointerDownFocus(event);
    };
    cursorNodes = {
        TEXTAREA: !0,
        INPUT: !0,
        OPTION: !0
    };
    clickTypes = {
        radio: !0,
        checkbox: !0,
        button: !0,
        submit: !0,
        image: !0,
        file: !0
    };
    proto.pointerDown = function (event, pointer) {
        var focused, isCursorInput = cursorNodes[event.target.nodeName] && !clickTypes[event.target.type];
        if (isCursorInput) {
            this.isPointerDown = !1;
            delete this.pointerIdentifier;
        } else {
            this._dragPointerDown(event, pointer);
            focused = document.activeElement;
            focused && focused.blur && focused != this.element && focused != document.body && focused.blur();
            this.pointerDownFocus(event);
            this.dragX = this.x;
            this.viewport.classList.add("is-pointer-down");
            this._bindPostStartEvents(event);
            this.pointerDownScroll = getScrollPosition();
            window.addEventListener("scroll", this);
            this.dispatchEvent("pointerDown", event, [pointer]);
        }
    };
    touchStartEvents = {
        touchstart: !0
    };
    focusNodes = {
        INPUT: !0,
        SELECT: !0
    };
    proto.pointerDownFocus = function (event) {
        if (this.options.accessibility && !touchStartEvents[event.type] && !focusNodes[event.target.nodeName]) {
            var prevScrollY = window.pageYOffset;
            this.element.focus();
            window.pageYOffset != prevScrollY && window.scrollTo(window.pageXOffset, prevScrollY);
        }
    };
    proto.canPreventDefaultOnPointerDown = function (event) {
        var isTouchstart = "touchstart" == event.type,
            targetNodeName = event.target.nodeName;
        return !isTouchstart && "SELECT" != targetNodeName;
    };
    proto.pointerUp = function (event, pointer) {
        delete this.isTouchScrolling;
        this.viewport.classList.remove("is-pointer-down");
        this.dispatchEvent("pointerUp", event, [pointer]);
        this._dragPointerUp(event, pointer);
    };
    proto.pointerDone = function () {
        window.removeEventListener("scroll", this);
        delete this.pointerDownScroll;
    };
    proto.dragStart = function (event, pointer) {
        this.dragStartPosition = this.x;
        this.startAnimation();
        window.removeEventListener("scroll", this);
        this.dispatchEvent("dragStart", event, [pointer]);
    };
    proto.pointerMove = function (event, pointer) {
        var moveVector = this._dragPointerMove(event, pointer);
        this.dispatchEvent("pointerMove", event, [pointer, moveVector]);
        this._dragMove(event, pointer, moveVector);
    };
    proto.dragMove = function (event, pointer, moveVector) {
        var direction, dragX, originBound, endBound;
        event.preventDefault();
        this.previousDragX = this.dragX;
        direction = this.options.rightToLeft ? -1 : 1;
        dragX = this.dragStartPosition + moveVector.x * direction;
        if (this.slides.length) {
            originBound = Math.max(-this.slides[0].target, this.dragStartPosition);
            dragX = dragX > originBound ? .5 * (dragX + originBound) : dragX;
            endBound = Math.min(-this.getLastSlide().target, this.dragStartPosition);
            dragX = endBound > dragX ? .5 * (dragX + endBound) : dragX;
        }
        this.dragX = dragX;
        this.dragMoveTime = new Date();
        this.dispatchEvent("dragMove", event, [pointer, moveVector]);
    };
    proto.dragEnd = function (event, pointer) {
        var index, restingX;
        index = this.dragEndRestingSelect();
        if (this.options.freeScroll) {
            restingX = this.getRestingPosition();
            this.isFreeScrolling = -restingX > this.slides[0].target && -restingX < this.getLastSlide().target;
        } else this.options.freeScroll || index != this.selectedIndex || (index += this.dragEndBoostSelect());
        delete this.previousDragX;
        this.select(index);
        this.dispatchEvent("dragEnd", event, [pointer]);
    };
    proto.dragEndRestingSelect = function () {
        var restingX = this.getRestingPosition(),
            distance = Math.abs(this.getSlideDistance(-restingX, this.selectedIndex)),
            positiveResting = this._getClosestResting(restingX, distance, 1),
            negativeResting = this._getClosestResting(restingX, distance, -1),
            index = positiveResting.distance < negativeResting.distance ? positiveResting.index : negativeResting.index;
        return index;
    };
    proto._getClosestResting = function (restingX, distance, increment) {
        for (var index = this.selectedIndex, minDistance = 1 / 0, condition = this.options.contain ? function (d, md) {
                return md >= d;
            } : function (d, md) {
                return md > d;
            }; condition(distance, minDistance);) {
            index += increment;
            minDistance = distance;
            distance = this.getSlideDistance(-restingX, index);
            if (null === distance) break;
            distance = Math.abs(distance);
        }
        return {
            distance: minDistance,
            index: index - increment
        };
    };
    proto.getSlideDistance = function (x, index) {
        slide = this.slides[index];
        if (!slide) return null;
        return x - (slide.target);
    };
    proto.dragEndBoostSelect = function () {
        var distance, delta;
        if (void 0 === this.previousDragX || !this.dragMoveTime || new Date() - this.dragMoveTime > 100) return 0;
        distance = this.getSlideDistance(-this.dragX, this.selectedIndex);
        delta = this.previousDragX - this.dragX;
        return distance > 0 && delta > 0 ? 1 : 0 > distance && 0 > delta ? -1 : 0;
    };
    proto.staticClick = function (event, pointer) {
        var clickedCell = this.getParentCell(event.target),
            cellElem = clickedCell && clickedCell.element,
            cellIndex = clickedCell && this.cells.indexOf(clickedCell);
        this.dispatchEvent("staticClick", event, [pointer, cellElem, cellIndex]);
    };
    proto.onscroll = function () {
        var scroll = getScrollPosition(),
            scrollMoveX = this.pointerDownScroll.x - scroll.x,
            scrollMoveY = this.pointerDownScroll.y - scroll.y;
        (Math.abs(scrollMoveX) > 3 || Math.abs(scrollMoveY) > 3) && this._pointerDone();
    };

    function getScrollPosition() {
        return {
            x: window.pageXOffset,
            y: window.pageYOffset
        };
    }
    return Flickity;
});

! function (window, factory) {
    window.TapListener = factory(window, window.Unipointer);
}(window, function (window, Unipointer) {
    function TapListener(elem) {
        this.bindTap(elem);
    }
    var proto = TapListener.prototype = Object.create(Unipointer.prototype);
    proto.bindTap = function (elem) {
        if (elem) {
            this.unbindTap();
            this.tapElement = elem;
            this._bindStartEvent(elem, !0);
        }
    };
    proto.unbindTap = function () {
        if (this.tapElement) {
            this._bindStartEvent(this.tapElement, !0);
            delete this.tapElement;
        }
    };
    proto.pointerUp = function (event, pointer) {
        var pointerPoint, boundingRect, scrollX, scrollY, isInside, _this;
        if (!this.isIgnoringMouseUp || "mouseup" != event.type) {
            pointerPoint = Unipointer.getPointerPoint(pointer);
            boundingRect = this.tapElement.getBoundingClientRect();
            scrollX = window.pageXOffset;
            scrollY = window.pageYOffset;
            isInside = !(pointerPoint.x < boundingRect.left + scrollX || pointerPoint.x > boundingRect.right + scrollX || pointerPoint.y < boundingRect.top + scrollY || pointerPoint.y > boundingRect.bottom + scrollY);
            isInside && this.emitEvent("tap", [event, pointer]);
            if ("mouseup" != event.type) {
                this.isIgnoringMouseUp = !0;
                _this = this;
                setTimeout(function () {
                    delete _this.isIgnoringMouseUp;
                }, 400);
            }
        }
    };
    proto.destroy = function () {
        this.pointerDone();
        this.unbindTap();
    };
    return TapListener;
});

! function (window, factory) {
    factory(window, window.Flickity, window.TapListener, window.fizzyUIUtils);
}(window, function (window, Flickity, TapListener, utils) {
    "use strict";

    function PrevNextButton(direction, parent) {
        this.direction = direction;
        this.parent = parent;
        this._create();
    }
    PrevNextButton.prototype = new TapListener();
    PrevNextButton.prototype._create = function () {
        this.isEnabled = !0;
        this.isPrevious = -1 == this.direction;
        var element = this.element = document.createElement("button");
        element.className = "flickity-prev-next-button";
        element.className += this.isPrevious ? " previous" : " next";
        element.setAttribute("type", "button");
        this.disable();
        element.setAttribute("aria-label", this.isPrevious ? "previous" : "next");
        this.on("tap", this.onTap);
        this.parent.on("select", this.update.bind(this));
        this.on("pointerDown", this.parent.childUIPointerDown.bind(this.parent));
    };
    PrevNextButton.prototype.activate = function () {
        this.bindTap(this.element);
        this.element.addEventListener("click", this);
        this.parent.element.appendChild(this.element);
    };
    PrevNextButton.prototype.deactivate = function () {
        this.parent.element.removeChild(this.element);
        TapListener.prototype.destroy.call(this);
        this.element.removeEventListener("click", this);
    };
    PrevNextButton.prototype.onTap = function () {
        if (this.isEnabled) {
            this.parent.emitEvent("uiChange");
            var method = this.isPrevious ? "previous" : "next";
            this.parent[method]();
        }
    };
    PrevNextButton.prototype.handleEvent = utils.handleEvent;
    PrevNextButton.prototype.onclick = function () {
        var focused = document.activeElement;
        focused && focused == this.element && this.onTap();
    };
    PrevNextButton.prototype.enable = function () {
        if (!this.isEnabled) {
            this.element.disabled = !1;
            this.isEnabled = !0;
        }
    };
    PrevNextButton.prototype.disable = function () {
        if (this.isEnabled) {
            this.element.disabled = !0;
            this.isEnabled = !1;
        }
    };
    PrevNextButton.prototype.update = function () {
        var lastIndex, boundIndex, method, slides = this.parent.slides;

        lastIndex = slides.length ? slides.length - 1 : 0;
        boundIndex = this.isPrevious ? 0 : lastIndex;
        method = this.parent.selectedIndex == boundIndex ? "disable" : "enable";
        this[method]();

    };
    PrevNextButton.prototype.destroy = function () {
        this.deactivate();
    };
    utils.extend(Flickity.defaults, {
        prevNextButtons: !0
    });
    Flickity.createMethods.push("_createPrevNextButtons");
    var proto = Flickity.prototype;
    proto._createPrevNextButtons = function () {
        if (this.options.prevNextButtons) {
            this.prevButton = new PrevNextButton(-1, this);
            this.nextButton = new PrevNextButton(1, this);
            this.on("activate", this.activatePrevNextButtons);
        }
    };
    proto.activatePrevNextButtons = function () {
        this.prevButton.activate();
        this.nextButton.activate();
        this.on("deactivate", this.deactivatePrevNextButtons);
    };
    proto.deactivatePrevNextButtons = function () {
        this.prevButton.deactivate();
        this.nextButton.deactivate();
        this.off("deactivate", this.deactivatePrevNextButtons);
    };
    Flickity.PrevNextButton = PrevNextButton;
    return Flickity;
});

! function (window, factory) {
    window.Flickity = factory(window.Flickity, window.fizzyUIUtils);
}(window, function (Flickity, utils) {
    Flickity.createMethods.push("_createAsNavFor");
    var proto = Flickity.prototype;
    proto._createAsNavFor = function () {
        var asNavForOption, _this;
        this.on("activate", this.navCompanionSelect(!0));
        this.on("deactivate", this.removeNavSelectedElements());
        this.on("destroy", this.destroyAsNavFor);
        asNavForOption = this.options.asNavFor;
        if (asNavForOption) {
            _this = this;
            setTimeout(function () {
                _this.setNavCompanion(asNavForOption);
            });
        }
    };
    proto.setNavCompanion = function (elem) {
        var companion, _this;
        elem = utils.getQueryElement(elem);
        companion = Flickity.data(elem);
        if (companion && companion != this) {
            this.navCompanion = companion;
            _this = this;
            this.onNavCompanionSelect = function () {
                _this.navCompanionSelect();
            };
            companion.on("select", this.onNavCompanionSelect);
            this.on("staticClick", this.onNavStaticClick);
            this.navCompanionSelect(!0);
        }
    };
    proto.navCompanionSelect = function () {
        var selectedCell, firstIndex, lastIndex, selectIndex, selectedCells;
        if (this.navCompanion) {
            selectedCell = this.navCompanion.selectedCells[0];
            firstIndex = this.navCompanion.cells.indexOf(selectedCell);
            lastIndex = firstIndex + this.navCompanion.selectedCells.length - 1;
            selectIndex = Math.floor(lerp(firstIndex, lastIndex, this.navCompanion.cellAlign));
            this.selectCell(selectIndex, !1);
            this.removeNavSelectedElements();
            if (selectIndex < this.cells.length) {
                selectedCells = this.cells.slice(firstIndex, lastIndex + 1);
                this.navSelectedElements = selectedCells.map(function (cell) {
                    return cell.element;
                });
                this.changeNavSelectedClass("add");
            }
        }
    };

    function lerp(a, b, t) {
        return (b - a) * t + a;
    }
    proto.changeNavSelectedClass = function (method) {
        this.navSelectedElements.forEach(function (navElem) {
            navElem.classList[method]("is-nav-selected");
        });
    };
    proto.removeNavSelectedElements = function () {
        if (this.navSelectedElements) {
            this.changeNavSelectedClass("remove");
            delete this.navSelectedElements;
        }
    };
    proto.onNavStaticClick = function (event, pointer, cellElement, cellIndex) {
        "number" == typeof cellIndex && this.navCompanion.selectCell(cellIndex);
    };
    proto.destroyAsNavFor = function () {
        if (this.navCompanion) {
            this.navCompanion.off("select", this.onNavCompanionSelect);
            this.off("staticClick", this.onNavStaticClick);
            delete this.navCompanion;
        }
    };
    return Flickity;
});
