var LayoutGroupModule = (function(p) {
	/*\
	|*|
	|*| Private constants
	|*| % units are a percent of the layout group's width.
	|*|
	\*/

	// Keyboard inputs
	var KEYBOARD = {
		TAB : 9,
		ENTER : 13,
		ESCAPE : 27,
		SPACE : 32,
		LEFT : 37,
		UP : 38,
		RIGHT : 39,
		DOWN : 40
	},

	LOGGING = false,

	// The first and last elements can be swiped to one another iff IS_CIRCULAR.
	// Must be disabled because there is a bug with how circular swipe interacts with visible when on client
	/*IS_CIRCULAR = false,*/

	// Transform properties to use for CSS
	TRANSFORM_PROP,
	TRANSITION_PROP,

	// Swipe distance in % that must be exceeded to move to the next layout regardless of swipe velocity
        IDLE_SWIPE_PERCENT = 35,

	// Swipe velocity in px/s that must be exceeded to move to the next layout.
	FAST_SWIPE_SPEED = 300,

	// Average speed in %/s the layouts should move to reseat after a swipe ends
	SLIDE_SPEED = 250,

	// enum for nextLayoutDirection
	FIRST_MOVE = 0,
	LEFT = 1,
	RIGHT = 2,

	INDICATOR_ENABLED = true,
	INDICATOR_WAITTIME = 500, // The wait time is identical to the transition timeout set in pzBaseCore.

	// Half the size in pixels of the side of the scroll box.
	// The scroll box surrounds the point of the touch start event.
	// The user commits to swiping horizontally or scrolling vertically when the touch move events escape the box.
        SCROLL_BOX_RADIUS = 50,

	/*\
	|*|
	|*| Private static variables
	|*|
	\*/

	startClientX = 0,
	startClientY = 0,
	windowSize = 0, // If windowSize is different from 0, then we are in the middle of a swipe
	xDisplacementPrev = 0,
	startSwipeTimeInMs = 0,
	prevSwipeTimeInMs = 0,
	
	// Instantaneous velocity of the swipe based on xDisplacementPrev, prevSwipeTimeInMs, the current position, and the current time
	swipeVelocity = 0, // px/s

	nextLayoutDirection = FIRST_MOVE,

	// The layout body adjacent to selected layout that is partially visible.
	// This is equal to either null, beforeLayoutBodyIn, or afterLayoutBodyIn.
	nextLayoutBodyIn = null,

	// The layout body adjacent to selected layout that is hidden.
	// This is equal to either null, beforeLayoutBodyIn, or afterLayoutBodyIn.
	hiddenLayoutBodyIn = null,
	
	// The layout body that should be selected after a negative swipe
	beforeLayoutBodyIn = null,

	// The layout body that should be selected after a positive swipe
	afterLayoutBodyIn = null,

	// True if the layout group should select a different layout after the swipe
	swipeNextLayout = false,

	// True if the current scroll event has not yet escaped the scroll box
	withinScrollBox = true,

	layoutBodyHeight = 0,
	headerHeight = 0,
	beforeLayoutBodyHeight = 0,
	afterLayoutBodyHeight = 0,

	touchStart = 'touchstart',
	touchMove = 'touchmove',
	touchEnd = 'touchend',
	touchCancel = 'touchcancel',
	// If not null, this event is treated like touchCancel
	// On Microsoft Surface, the event is abandoned after firing touchOut, so touchCancel will never be fired
	touchOut = null,

	// Equal to touchMove + " " + touchEnd + " " + touchCancel + " " + touchOut in _initializeLayoutGroup
	touchBindEvents = '',

	// Testing browser prefix detection
	browser_prefix = '',

	lastFocusedError = "",
        
	flagToStopEvent  = true,
    
    defaultDeltaDistanceToShiftTabsBy = 150,
  	initialMarginForArrows = 0,
          		
  	currentMarginForSection = "",
    currentTabHeight = "";
   	
	/*\
	|*|
	|*| Private methods
	|*|
	\*/
	_isTouchDevice = function() {
		return 'ontouchstart' in window || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
	},

	_setBrowserPrefix = function() {
		var animation = false,
		    animationstring = 'animation',
		    elm = $("body")[0],
		    keyframeprefix = '',
		    domPrefixes = 'Webkit Moz'.split(' '),
		    pfx  = '';
		if( elm.style.animationName !== undefined ) { animation = true; }
		if( animation === false ) {
			for( var i = 0; i < domPrefixes.length; i++ ) {
				if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
					pfx = domPrefixes[ i ];
					animationstring = pfx + 'Animation';
					keyframeprefix = '-' + pfx.toLowerCase() + '-';
					animation = true;
					break;
				}
			}
		}

		TRANSFORM_PROP = keyframeprefix + 'transform';
		TRANSITION_PROP = keyframeprefix + 'transition';
	},

	// Support for pagination during a swipe
	_showLayoutPagination = function(layoutgroup) {
		var paginationElem = "<div class='layout-group-selector'>";
		layoutgroup.children(".layout").each(function generateIndexSelector(index) {
			if ($(this).css("display") != "none") {
				paginationElem += "<i class='icon icon-selector";
				if ($(this).hasClass("active"))
					paginationElem += " active";
				paginationElem += "'></i>";
			}
		});
		paginationElem += "</div>";
		layoutgroup.append(paginationElem);
	},

	_removeLayoutPagination = function(layoutgroup) {
		layoutgroup.children(".layout-group-selector").remove();
	},

	/*
	 * During a swipe, this function returns true if _swipeLayoutMove has been
	 * called during this swipe event and it displaced the layout at some point.
	 * This will happen once the touch pointer is moved beyond the scroll box
	 * (See SCROLL_BOX_RADIUS and withinScrollBox). Notably, this will return true
	 * even if the layout happens to be in the same position it started in, as long
	 * as it moved in the past during the current swipe event.
	 *
	 * During a swipe, this function will return false if _swipeLayoutMove
	 * has not displaced the layout.
	 *
	 * The return value is not defined if a swipe is not in progress.
	 */
	_hasBeenSwiped = function() {
		return nextLayoutDirection !== FIRST_MOVE;
	},

	// enable and disable listener for touchmove and touchend once a swipe start is detected
	_enableSwipeListener = function(layoutBody) {
		// TODO: See if it's better to split this into three distinct functions
		layoutBody.on(
			touchBindEvents,
			function (e) {
				if (e.type == touchMove) {
					return _swipeLayoutMove($(this), e);
				}
				else if (e.type == touchEnd) {
					return _swipeLayoutEnd($(this), e);
				}
				else if (e.type == touchCancel) {
					_swipeCancel($(this).parent().parent(), $(this));
					// fourth parent up from child body is the layout group element
					var layoutgroup = layoutBody.parent().parent().parent().parent();
					_queueDestroySwipeIndicators(layoutgroup);
					return true;
				}
				else if (e.type == touchOut) {
					if (!_pointIsInElement(_getTouchPoint(e), this)) {
						_swipeCancel($(this).parent().parent(), $(this));
						// fourth parent up from child body is the layout group element
						var layoutgroup = layoutBody.parent().parent().parent().parent();
						_queueDestroySwipeIndicators(layoutgroup);
					}
					return true;
				}
				return false;
			}
		);
	},

	_disableSwipeListener = function(layoutBody) {
		layoutBody.off(touchBindEvents);
	},

	_isSwipeAllowed = function(layoutgroup) {
		if (windowSize != 0 || layoutgroup.hasClass("swipe-enabled"))
			return false;
		return true;
	},

	// Cancel the swipe - restore initial conditions
	_swipeCancel = function(layoutgroup, layoutBody) {
		if (LOGGING) console.log("_swipeCancel");
		layoutBody.css(TRANSITION_PROP, '');
		layoutBody.css(TRANSFORM_PROP, '');
		if (nextLayoutBodyIn) {
			nextLayoutBodyIn.css(TRANSITION_PROP, '');
			nextLayoutBodyIn.css(TRANSFORM_PROP, '');
		}

		windowSize = 0;
		layoutgroup.removeClass('swipe-enabled');

		// Hide overflow originally set in _swipeLayoutStart
		layoutgroup.parent().css('overflow-x', '');

		layoutBody.css("margin-top", '');
		beforeLayoutBodyIn.css("margin-top", '');
		afterLayoutBodyIn.css("margin-top", '');

		layoutgroup.css("margin-bottom", "");
		_removeLayoutPagination(layoutgroup);
		if (nextLayoutBodyIn) {
			nextLayoutBodyIn.parent().removeClass("active");
		}
		_disableSwipeListener(layoutBody);
	},

	_getLayoutBeforeActive = function(layoutgroup, activeLayout) {
		if (LOGGING) console.log("_getLayoutBeforeActive");
		if (activeLayout == null) {
			var layouts = $(layoutgroup[0]).children(".layout-body").children(".content-layout-group");
			if (layouts.length == 0)
				layouts = $(layoutgroup[0]).children(".layout-body").children(".content").children(".content-layout-group");
			activeLayout=$(layouts.children('.active')[0]);
		}

		var beforeLayout = activeLayout.prev('.layout');

		/*if (IS_CIRCULAR) {
			if (beforeLayout.length == 0)
				beforeLayout = layoutgroup.children(".layout:last");
			if (afterLayout.length == 0)
				afterLayout = layoutgroup.children(".layout:first");
		}*/

		while (beforeLayout.css('display') == 'none')
			beforeLayout = beforeLayout.prev('.layout');

		return beforeLayout;
	},

	_getLayoutAfterActive = function(layoutgroup, activeLayout) {
		if (LOGGING) console.log("_getLayoutAfterActive");
		if (activeLayout == null) {
			var layouts = $(layoutgroup[0]).children(".layout-body").children(".content-layout-group");
			if (layouts.length == 0)
				layouts = $(layoutgroup[0]).children(".layout-body").children(".content").children(".content-layout-group");
			activeLayout=$(layouts.children('.active')[0]);
		}

		var afterLayout = activeLayout.next('.layout');

		/*if (IS_CIRCULAR) {
			if (beforeLayout.length == 0)
				beforeLayout = layoutgroup.children(".layout:last");
			if (afterLayout.length == 0)
				afterLayout = layoutgroup.children(".layout:first");
		}*/

		while (afterLayout.css('display') == 'none')
			afterLayout = afterLayout.next('.layout');

		return afterLayout;
	},

	// Handle for touch start
	_swipeLayoutStart = function(layoutBody, e) {
		if (LOGGING) console.log("_swipeLayoutStart");
		var layoutgroup = layoutBody.parent().parent();

		// In the middle of a swipe already or Menu is opened - just return false - no bubble up
		if (!_isSwipeAllowed(layoutgroup))
			return false;

		// if  - swipe is not allowed - bubble up so that vertical scrolling is allowed.
		if (layoutgroup.hasClass('layout-group-nav-open'))
			return true;

		// type of layout group we're in
		var lgType = _getLayoutGroupType(layoutgroup),
		    isMenu = 'menu' == lgType,
		    isTab = 'tab' == lgType;

		// if - we are not in "swipeable" type of LG bubble up so that vertical scrolling is allowed.
		if (!isMenu && !isTab)
			return true;

		if (e.originalEvent.touches && e.originalEvent.touches[0]) {
			startClientX = e.originalEvent.touches[0].pageX;
			startClientY = e.originalEvent.touches[0].pageY;
		}
		else {
			startClientX = e.originalEvent.pageX;
			startClientY = e.originalEvent.pageY;
		}
			/* TODO : Need to comment, because performance is effected by reflow */
		_initializeSwipeIndicators(layoutgroup.parent().parent(), startClientY);
		windowSize = layoutBody.width();
		xDisplacementPrev = 0;
		startSwipeTimeInMs = prevSwipeTimeInMs = Date.now();
		beforeLayoutBodyHeight = 0;
		afterLayoutBodyHeight = 0;
		swipeVelocity = 0;
		nextLayoutDirection = FIRST_MOVE;
		nextLayoutBodyIn = null;
		layoutBodyHeight = layoutBody.outerHeight();
		var layout = layoutBody.parent();
		headerHeight = layoutgroup.outerHeight();
		withinScrollBox = true;

		// Find the before and after layout
		afterLayout = _getLayoutAfterActive(layoutgroup,layout);
		beforeLayout = _getLayoutBeforeActive(layoutgroup,layout);

		beforeLayoutBodyIn = beforeLayout.children(".layout-body");
		afterLayoutBodyIn = afterLayout.children(".layout-body");

		// Create space for body when transform is active
		layoutgroup.css("margin-bottom", layoutBodyHeight);

		// Override CSS margins before calculating transform or adding swipe-enabled
		layoutBody.css("margin-top", 0);
		beforeLayoutBodyIn.css("margin-top", 0);
		afterLayoutBodyIn.css("margin-top", 0);

		// Calculate top for transform when not a nested layout group
		var actualTop = layoutBody.offset().top - layoutgroup.offset().top;
		layoutBody.css("top", actualTop);
		beforeLayoutBodyIn.css("top", actualTop);
		afterLayoutBodyIn.css("top", actualTop);

		layoutgroup.addClass('swipe-enabled');

		// Don't show part of layouts that extends beyond the layout window
		layoutgroup.parent().css('overflow-x', 'hidden');

		_showLayoutPagination(layoutgroup);
		_enableSwipeListener(layoutBody);

		return true; // bubble up for vertical scroll
	},

	// Swipe move event handler
	_swipeLayoutMove = function(layoutBody, e) {
		if (LOGGING) console.log("_swipeLayoutMove");

		// Get cursor displacement from its position at _swipeLayoutStart
		var touchPosition = _getTouchPoint(e),
		    xDisplacement = touchPosition.X - startClientX,
		    yDisplacement = touchPosition.Y - startClientY,
		    layoutgroup = layoutBody.parent().parent();

		// detection of vertical swipe
		if (withinScrollBox) {
			if (Math.abs(yDisplacement) > SCROLL_BOX_RADIUS
					&& Math.abs(yDisplacement) > Math.abs(xDisplacement)) {
				// vertical swipe - cancel the default behavior
				_swipeCancel(layoutgroup, layoutBody);
				window.setTimeout(_queueDestroySwipeIndicators, 1000, layoutgroup.parent().parent());
				return true;
			}
			else if (Math.abs(xDisplacement) > SCROLL_BOX_RADIUS
					&& Math.abs(xDisplacement) > Math.abs(yDisplacement)) {
				// horizontal swipe - continue the default behavior
				withinScrollBox = false;
			}
		}

		// Get swipe velocity at time of release
		// Value truncated to the nearest int
		var currentSwipeTimeInMs = Date.now();
		swipeVelocity = (xDisplacement - xDisplacementPrev) * 1000 / (currentSwipeTimeInMs - prevSwipeTimeInMs) | 0; // %/s

		// true iff we change which layout is visible
		var switchNext;

		if (xDisplacement < 0) {
			nextLayoutBodyIn = afterLayoutBodyIn;
			hiddenLayoutBodyIn = beforeLayoutBodyIn;
			switchNext = nextLayoutDirection != RIGHT;
			nextLayoutDirection = RIGHT;
		}
		else {
			nextLayoutBodyIn = beforeLayoutBodyIn;
			hiddenLayoutBodyIn = afterLayoutBodyIn;
			switchNext = nextLayoutDirection != LEFT;
			nextLayoutDirection = LEFT;
		}

		if (switchNext) {
			// make next layout active and adjust the layout group height accordingly
			if (nextLayoutBodyIn.length != 0) {
				nextLayoutBodyIn.parent().addClass('active no-highlight');

				var nextLayoutInBodyHeight = 0;
				if (nextLayoutDirection == RIGHT) {
					if (afterLayoutBodyHeight == 0)
						afterLayoutBodyHeight = nextLayoutBodyIn.outerHeight();
					nextLayoutInBodyHeight = afterLayoutBodyHeight;
				}
				else {
					if (beforeLayoutBodyHeight == 0)
						beforeLayoutBodyHeight = nextLayoutBodyIn.outerHeight();
					nextLayoutInBodyHeight = beforeLayoutBodyHeight;
				}
				layoutgroup.css("margin-bottom", Math.max(layoutBodyHeight, nextLayoutInBodyHeight));
			}

			// Undo all changes made while hidden layout was active
			if (hiddenLayoutBodyIn.length != 0) {
				hiddenLayoutBodyIn.parent().removeClass('active no-highlight');
				hiddenLayoutBodyIn.css(TRANSFORM_PROP, '');
			}
		}

		// Remember this event
		xDisplacementPrev = xDisplacement;
		prevSwipeTimeInMs = currentSwipeTimeInMs;

		// Position current and next layouts
		_transformLayouts(layoutBody);

		return false;
	},

	// May be called at the end of a swipe if _swipeCancel isn't called.
	_swipeLayoutEnd = function(layoutBody, e) {
		if (LOGGING) console.log("_swipeLayoutEnd");
		var layoutgroup = layoutBody.parent().parent();

		if (nextLayoutBodyIn === null || withinScrollBox) {
			_swipeCancel(layoutgroup, layoutBody);
			_queueDestroySwipeIndicators(layoutgroup.parent().parent());
			return true;
		}
		window.setTimeout(_queueDestroySwipeIndicators, 500, layoutgroup.parent().parent());

		// Distance the body is actually scrolled
		var percentDistance = Math.abs(100 * xDisplacementPrev / windowSize);

		// If there is no next layout, never move to it
		if (nextLayoutBodyIn.length == 0) {
			// Since we're scrolling off the edge, use _resistanceFactor to get the actual scroll distance instead of the pointer distance
			percentDistance = _resistanceFactor(percentDistance);
			swipeNextLayout = false;
		}
		// If swiping quickly to the next layout, move to it
		else if (xDisplacementPrev > 0 && swipeVelocity > FAST_SWIPE_SPEED) {
			swipeNextLayout = true;
		}
		else if (xDisplacementPrev < 0 && swipeVelocity < -FAST_SWIPE_SPEED) {
			swipeNextLayout = true;
		}
		// If swiped more than 50%, move to the next one
		else if (percentDistance >= IDLE_SWIPE_PERCENT) {
			swipeNextLayout = true;
		}
		else
			swipeNextLayout = false;

		var TRANSLATE_CENTER = "translate3d(0%,0,0)",
		    TRANSLATE_LEFT = "translate3d(-100%,0,0)",
		    TRANSLATE_RIGHT = "translate3d(100%,0,0)",
		    translateLayout,
		    translateNextLayout;
		
		// Determine direction to transition current and next layout
		if (swipeNextLayout) {
			nextLayoutBodyIn.parent().addClass('active no-highlight');

			// Transition next layout to center and current layout to the side
			if (xDisplacementPrev < 0) {
				translateLayout = TRANSLATE_LEFT;
				translateNextLayout = TRANSLATE_CENTER;
			}
			else {
				translateLayout = TRANSLATE_RIGHT;
				translateNextLayout = TRANSLATE_CENTER;
			}
		}
		else {
			// Transition current layout to center and next layout to the side
			if (xDisplacementPrev < 0) {
				translateLayout = TRANSLATE_CENTER;
				translateNextLayout = TRANSLATE_RIGHT;
			}
			else {
				translateLayout = TRANSLATE_CENTER;
				translateNextLayout = TRANSLATE_LEFT;
			}
		}

		// Determine transition time based on distance
		var transitionDistance = swipeNextLayout ? Math.abs(100 - percentDistance) : percentDistance, // %
		    transitionTime = swipeNextLayout ? transitionDistance / SLIDE_SPEED : 100 / SLIDE_SPEED; // s

		// Remove inline styles and set selected element as active
		if (transitionTime > 0) {
			var coordinates = _transitionCoordinates(
					Math.abs(windowSize - Math.abs(xDisplacementPrev)),
					transitionTime,
					Math.max(Math.abs(swipeVelocity), 800)),
			    transitionFunction = 'cubic-bezier(' + coordinates.X1 + ', ' + coordinates.Y1 + ', ' + coordinates.X2 + ', ' + coordinates.Y2 + ')',
			    transitionValue = TRANSFORM_PROP + ' ' + transitionTime + 's ' + transitionFunction;

			if (LOGGING) console.log(transitionValue);
			// Transition to selected element
			// These inline styles will be removed by _transitionEndEvent
			layoutBody.css(TRANSITION_PROP, transitionValue);
			layoutBody.css(TRANSFORM_PROP, translateLayout);
			nextLayoutBodyIn.css(TRANSITION_PROP, transitionValue);
			nextLayoutBodyIn.css(TRANSFORM_PROP, translateNextLayout);

			layoutBody.bind(
				'transitionend webkitTransitionEnd',
				function(e) {
					layoutBody.css(TRANSITION_PROP, '');
					layoutBody.css(TRANSFORM_PROP, '');
					nextLayoutBodyIn.css(TRANSITION_PROP, '');
					nextLayoutBodyIn.css(TRANSFORM_PROP, '');

					_transitionEnd(layoutBody);

					layoutBody.unbind('transitionend webkitTransitionEnd');
				}
			);
		}
		else
			_transitionEnd(layoutBody);

		_disableSwipeListener(layoutBody);

		return !_hasBeenSwiped();
	},
	
	/*
	 * Return the percent displacement we should actually use when dragging
	 * "off the edge", based on the percent displacement of the drag cursor.
	 *
	 * This function y(x) will follow these criteria:
	 *     y(0) = 0
	 *     y'(0) = 1
	 *     y'(x) > 0 for x > 0
	 *     y''(x) < 0 for x > 0
	 *     y(-x) = -y(x)
	 * This way, swiping off edge has diminishing returns, but y and y' are
	 * continuous with a normal swipe (where y = x).
	 *
	 * @param percentDisplaced: The cursor's displacement, from the point the swipe
	 *                          started at, along the same direction as the swipe.
	 */
	_resistanceFactor = function(percentDisplaced) {
		var F = 25; // affects how close to linear this function is
		var B = Math.log(F);
		var x = Math.abs(percentDisplaced);
		var y = F * (Math.log(F + x) - B); // y'(x) = F / (F + x)
		var sign = percentDisplaced > 0 ? 1 : -1; // Math.sign(percentDisplaced)
		return sign * y;
	},
	
	/*
	 * Returns the coordinates for a 3D bezier curve as an object { X1, Y1, X2, Y2 }
	 * such that the initial speed matches the user's swipe speed.
	 * In CSS, this could be used to make the transition function 'cubic-bezier(X1, Y1, X2, Y2)'.
	 * @param d: The pixel distance the selected layout will travel
	 * @param t: The time in seconds the selected layout will travel
	 * @param v: The current speed in pixels/second the selected layout is being dragged at.
	 *           Positive values point towards the final position the layout will be in when the animation finishes.
	 */
	_transitionCoordinates = function(d, t, v) {
		// Get first Bezier coordinate (T1, D1) such that the slope from (0, 0) to (T1, D1) is v.
		// T1 and D1 are in fractional units of t and d respectively (e.g., (1, 1) == (t, d)).
		var N = 0.3; // first coordinate normal
		var VT = 1 / t; // percent time of 1 second
		var VD = v / d; // percent distance per second
		var VH = Math.sqrt(VD * VD + VT * VT); // absolute value of position (VD, VT)
		var C = N / VH; // conversion factor to normalize VD, VT
		var T1 = VT * C;
		var D1 = VD * C;
		var T2 = 0.5;
		var D2 = 0.95;
		return { X1: T1, Y1: D1, X2: T2, Y2: D2 };
	},
	
	_transitionEnd = function(layoutBody) {
		if (LOGGING) console.log("_transitionEnd");
		var layout = layoutBody.parent(),
		    nextLayout = nextLayoutBodyIn.parent();
		if (swipeNextLayout) {
			layout.removeClass('active');
			_makeLayoutActive(layout.parent(), nextLayoutBodyIn.parent().children('.header'));
			var $lg = layout.parent(),
			    locTop = $lg[0].getBoundingClientRect().top,
			    sl = $(".screen-layout-region-header");
			if(sl.length>0 && locTop<sl.height()){
				$lg[0].scrollIntoView();
			} else if (sl.length <= 0 && locTop < 0) {
				$lg[0].scrollIntoView();
			} 
		}
		else
			nextLayout.removeClass('active');

		nextLayout.removeClass('no-highlight');

		layoutBody.css("margin-top", '');
		beforeLayoutBodyIn.css("margin-top", '');
		afterLayoutBodyIn.css("margin-top", '');

		var layoutgroup = layout.parent()
		if (layoutgroup.hasClass('swipe-enabled')) {
			layoutgroup.removeClass('swipe-enabled');
			layoutgroup.css("margin-bottom", "");
			_removeLayoutPagination(layoutgroup);
			windowSize = 0; // Another swipe gesture is now allowed
		}
	},

	// Given the content-layout-group DIV, this function returns its layout group type.
	// The layout group types are 'accordion', 'menu', 'stacked', and 'tab'.
	_getLayoutGroupType = function(layoutgroup) {
		if (LOGGING) console.log("_getLayoutGroupType");
      
      	if(layoutgroup && layoutgroup.length == 0)
          	return "tab"; // default it is tab case when selecting from menu

		// Content value on :after is set to the layout group type by the skin
		var type = window.getComputedStyle(layoutgroup[0], ':after').getPropertyValue('content');

		// Some browsers put quotes around the type. Remove them for consistency
		if (type.length >= 2) {
			var firstChar = type.charAt(0),
			    lastChar = type.charAt(type.length - 1);
			if (firstChar == '"' && lastChar == '"'
			    || firstChar == "'" && lastChar == "'") {
				type = type.substring(1, type.length - 1);
			}
		}

		return type;
	},

	// Applies a transform to layoutBody and nextLayoutBodyIn based on the previous mouse position stored in xDisplacementPrev.
	_transformLayouts = function(layoutBody) {
		// Amount swiped across the screen, where 0 is no displacement, -100 is completely displaced to the left, and 100 to the right
		var percentDisplaced = 100 * xDisplacementPrev / windowSize,
		// If there is no next layout, add resistance to swipe.
		    nextLayoutTranslate = '';

		if (nextLayoutBodyIn.length == 0) {
			percentDisplaced = _resistanceFactor(percentDisplaced);
		}
		// Move next layout with mouse, if there is one
		else {
			// Position it next to current layout
			if (nextLayoutDirection == RIGHT) {
				nextLayoutTranslate = percentDisplaced + 100;
			}
			else {
				nextLayoutTranslate = percentDisplaced - 100;
			}

			// Move next layout with mouse
			nextLayoutBodyIn.css(TRANSFORM_PROP, 'translate3d(' + nextLayoutTranslate + '%,0,0)');
		}

		// Move current layout with mouse
		layoutBody.css(TRANSFORM_PROP, 'translate3d(' + percentDisplaced + '%,0,0)');
	},

	_getTouchPoint = function(e) {
		var xPos,
		    yPos;
		if (e.originalEvent.touches && e.originalEvent.touches[0]) {
			xPos = e.originalEvent.touches[0].pageX;
			yPos = e.originalEvent.touches[0].pageY;
		}
		else {
			xPos = e.originalEvent.pageX;
			yPos = e.originalEvent.pageY;
		}
		return { X: xPos, Y: yPos };
	},

	_pointIsInElement = function(point, element) {
		var xPos = point.X,
		    yPos = point.Y,
		    box = element.getBoundingClientRect();
		return box.left < xPos && xPos < box.right
			&& box.top < yPos && yPos < box.bottom;
	},

	/*
	 @protected will slide the tab headings just enough to bring the selected header into full view
	 @param $Object$layoutgroup   - DOM top level layout group element
	 @param $Object$selectedHeader    - DOM top level of the selected header
	 @return $void$
	*/
	_slideEnoughToBringSelectedHeaderIntoFullView = function(layoutgroup, selectedHeader) {      	
		var type = _getLayoutGroupType(layoutgroup);
      	if(type != "tab" || _toDisableSlideOnTabsClick(layoutgroup))
            return;
      	var $leftTabNavControls = layoutgroup.find(".left-tab-nav-controls"),
            $rightTabNavControls = layoutgroup.find(".right-tab-nav-controls"),
            $leftArrow = layoutgroup.find(".tab-arrow.left-arrow"),
            $rightArrow = layoutgroup.find(".tab-arrow.right-arrow");
      	/*begin HELPERS*/
      	var __isSelectedHeaderBetweenTheTwoArrows, __isSelectedHeaderCoveredByLeftArrow, __isSelectedHeaderCoveredByRightArrow, __computeDeltaFromLeftArrow, __computeDeltaFromRightArrow;
		function __L($el){/*__helper_getLeftOffsetFromParent including margin-left*/
			return (
						(parseInt($el.css("margin-left")) || 0)
						+
						$el.position().left
				   );
		}
      
        if(!$leftArrow.is(":visible"))/*we check that the left and right arrows are visible, only then, do we need to bring the half shown tab into full view*/
        {
          	/*mobile case = where < and > arrow buttons are not in dom and only the right side tab headings [dropdown?]menu exists*/

            __isSelectedHeaderBetweenTheTwoArrows = function() {
                return(
                        (__L(selectedHeader) >= 0)
                        &&
                        ((__L(selectedHeader) + selectedHeader.outerWidth()) <= $rightTabNavControls.position().left)
                      );
            };

            __isSelectedHeaderCoveredByLeftArrow = function() {
                return(
                        __L(selectedHeader) < 0
                      );
            };

            __isSelectedHeaderCoveredByRightArrow = function() {
                return(
                        (__L(selectedHeader) + selectedHeader.outerWidth()) > $rightTabNavControls.position().left
                      );
            };
          	
          	__computeDeltaFromLeftArrow = function(){
          		return (0 - __L(selectedHeader));
            };
          	
          	__computeDeltaFromRightArrow = function(){
          		return (__L(selectedHeader) + selectedHeader.outerWidth(true) - $rightTabNavControls.position().left);
            };
          	
        } else {
          	/*desktop case = where < and > arrow buttons and tab headings [dropdown?]menu exist*/

            __isSelectedHeaderBetweenTheTwoArrows = function() {
                return(
                        (__L(selectedHeader) >= ($leftTabNavControls.position().left + $leftTabNavControls.outerWidth(true)))
                        &&
                        ((__L(selectedHeader) + selectedHeader.outerWidth()) <= $rightTabNavControls.position().left)
                      );
            };

            __isSelectedHeaderCoveredByLeftArrow = function() {
                return(
                        __L(selectedHeader) < ($leftTabNavControls.position().left + $leftTabNavControls.outerWidth(true))
                      );
            };

            __isSelectedHeaderCoveredByRightArrow = function() {
                return(
                        (__L(selectedHeader) + selectedHeader.outerWidth()) > $rightTabNavControls.position().left
                      );
            };
          	
          	__computeDeltaFromLeftArrow = function(){
          		return ($leftTabNavControls.position().left + $leftTabNavControls.outerWidth(true) - __L(selectedHeader));
            };
          	
          	__computeDeltaFromRightArrow = function(){
          		return (__L(selectedHeader) + selectedHeader.outerWidth(true) - $rightTabNavControls.position().left);
            };
        }
      	/*end HELPERS*/
      	if(__isSelectedHeaderBetweenTheTwoArrows())
            return; /*the selected header is already in full view, nothing to do in this case*/
        else {
        
        	var $LGFirstTabHeadingRef = layoutgroup.find("[role='tab']:first"),
                deltaDistanceToShiftTabsBy = 0,
                currentMargin = parseInt($LGFirstTabHeadingRef.css("margin-left")) || 0,
                newMargin = 0;
          
          	if(__isSelectedHeaderCoveredByLeftArrow()) {
                
              	deltaDistanceToShiftTabsBy = __computeDeltaFromLeftArrow();
            	/*console.info("should move right by ",deltaDistanceToShiftTabsBy);*/
              	//$rightTabNavControls.find(".right-arrow").css("opacity", "1");
              	$rightTabNavControls.find(".right-arrow").removeClass("tab-arrow-inactive");
                newMargin = currentMargin + deltaDistanceToShiftTabsBy;
              	
            } else { /* implicitly we mean : if(__isSelectedHeaderCoveredByRightArrow())*/
              	
            	deltaDistanceToShiftTabsBy = __computeDeltaFromRightArrow();
            	/*console.info("should move left by ",deltaDistanceToShiftTabsBy);*/
              	//$leftTabNavControls.css("opacity", "1");
              	$leftTabNavControls.removeClass("tab-arrow-inactive");
                newMargin = currentMargin - deltaDistanceToShiftTabsBy;
              	
            }
          	if(selectedHeader && !selectedHeader.parent().next().attr("data-lg-child-id"))
            	$rightTabNavControls.find(".right-arrow").addClass("tab-arrow-inactive");
          	
          	var topCalculateBeforeScroll = layoutgroup.attr("data-topCalculateBeforeScroll");
          	if(topCalculateBeforeScroll && topCalculateBeforeScroll != 0){
          		var activeTab = _getActiveTabElement($(layoutgroup));      	     
      			_setSectionTransitionAttribute(activeTab, $(layoutgroup), "fromMenu");
            }
          	// commented as it is creating problem in height calculations 
      		//marginBeforeResize = newMargin;
          	layoutgroup.attr("data-marginBeforeResize",newMargin);
      		$LGFirstTabHeadingRef.css("margin-left", newMargin+"px");       
      	    if(topCalculateBeforeScroll && topCalculateBeforeScroll != 0)  	
      			_resetSectionTransitionAttribute(activeTab, $(layoutgroup), currentMarginForSection, currentTabHeight, $rightTabNavControls, $LGFirstTabHeadingRef);
          	
        }
	},

	/*
	 @protected will update the layout height based on the currently loaded tab content height <we need to do this, because of position: absolute on TabLG|div[role='tablist']>
	 @param $Object$layoutgroup    - DOM layout group element
	 @return $void$
	*/
	_updateLayoutHeight = function(layoutgroup, selectedHeader, nestedLG) {      	
      	if(selectedHeader){
          	var nestedLayout = (selectedHeader.next().find(".tab-overflow").length != 0 && ((selectedHeader.next().find(".tab-overflow").length == 1 && _getLayoutGroupType(selectedHeader.next().find(".tab-overflow").children()) == 'tab') || (selectedHeader.next().find(".tab-overflow").length > 1 && _getLayoutGroupType([selectedHeader.next().find(".tab-overflow")[0]]) == 'tab')));
          	if(nestedLayout){
                var hg = selectedHeader.next().find(".layout-body:visible").outerHeight(true)+selectedHeader.outerHeight(true);
                selectedHeader.next().height(hg);
                layoutgroup.parent().height(selectedHeader.next().outerHeight(true)+selectedHeader.outerHeight(true));
            } else
            	layoutgroup.parent().height(selectedHeader.next().outerHeight(true)+selectedHeader.outerHeight(true));           	
        } else { 
			if(nestedLG){
              	var activeTab = _getActiveTabElement($(layoutgroup));
            	layoutgroup.parent().height(activeTab.next().outerHeight(true)+activeTab.outerHeight(true));
            } else
          		layoutgroup.parent().height( (layoutgroup.initialOnLoadHeight || 0) + parseInt(layoutgroup.height()) );
        }
      
      	/* BUG-268549 */
      	var layoutWidth = layoutgroup.width();
      	if(!layoutWidth){
            var lgParentPosition = layoutgroup.parent().css("position");
            layoutgroup.parent().css("position", "static");
            layoutgroup.parent().width(0.97*(parseInt(layoutgroup.width())));
            layoutgroup.parent().css("position", lgParentPosition);
        }
      
	},      

	/*
	 @protected will set the active class and set the aria attributes on the selected header and update the menu nav
	 @param $Object$layoutgroup   - DOM top level layout group element
	 @param $Object$selectedHeader    - DOM top level of the selected header
	 @return $void$
	*/
	_setLayoutActive = function(layoutgroup, selectedHeader) {
		if (LOGGING) console.log("_setLayoutActive");
      	selectedHeader.parent().addClass('active');
		selectedHeader.parent().toggleClass('multiactive');
		selectedHeader.attr('tabindex', '0');
		selectedHeader.attr('aria-selected', 'true');
		var groupNavElement = layoutgroup.find('> .layout-group-nav > .layout-group-nav-title');
		if (groupNavElement.length == 1) {
			groupNavElement[0].lastChild.data = selectedHeader.children('.layout-group-item-title').text();
		}
		if (selectedHeader.attr("data-defer") == "true") {
			var selectedBody = selectedHeader.next();
            eventObj = null;
            if (typeof(event) != "undefined" ){
                eventObj = event;
            }
			pega.u.d.loadLayout(selectedHeader[0], eventObj, 'section', selectedBody[0], selectedBody.attr("data-deferinvoke"));
			selectedHeader.removeAttr("data-defer");
		}
        // Todo: research potential optimization -- _updateStretchTabWidth is smarter about counting hidden children; then this call can be removed.
		_updateStretchTabWidths(selectedHeader.parent());

      	if(!_isTouchDevice()){
            if(((layoutgroup.hasClass("tab-overflow") && !layoutgroup.hasClass("stretch-tabs")) || (layoutgroup.parent().hasClass("tab-overflow") && !layoutgroup.hasClass("stretch-tabs"))) && (event && event.type != "touchstart")){ 
          	//if(layoutgroup.hasClass("tab-overflow") && !layoutgroup.hasClass("stretch-tabs") && (event && event.type != "touchstart")){        	
                _slideEnoughToBringSelectedHeaderIntoFullView(layoutgroup, selectedHeader);/*TabOverflowSpike START*/
                //_updateLayoutHeight(layoutgroup, selectedHeader);/*TabOverflowSpike END*/
            }
          	
			var type = _getLayoutGroupType(layoutgroup);
          	// BUG-268334 : Added height only in case of tab-overflow class 
            if(!layoutgroup.hasClass("stretch-tabs") && type == 'tab' && layoutgroup.hasClass("tab-overflow"))
                _updateLayoutHeight(layoutgroup, selectedHeader);
        }
	},

	/*
	 @protected will remove the active class and change the aria attribute on the header
	 @param $Object$inactiveLayout    - DOM top level layout group element
	 @return $void$
	*/
	_setLayoutInactive = function(inactiveLayout) {
		inactiveLayout.removeClass('active').children('.layout-body').css("margin-top", "");
		inactiveLayout.children('.header').attr('tabindex', '-1').attr('aria-selected', 'false');
	},

	/*
	 @protected select the layout on click - set the active class on the selected header
	 @param $Object$layoutgroup   - DOM top level layout group element
	 @param $Object$selectedHeader    - DOM top level of the selected header
	 @return $void$
	*/
	_makeLayoutActive = function(layoutgroup, selectedHeader, currentActiveLayout) {
		if (LOGGING) console.log("_makeLayoutActive");
		//_queueDestroySwipeIndicators(layoutgroup);
		/* If the menu is opened and then we switch to a different type- need to remove the margin-top and remove the class */
		if (layoutgroup.hasClass('layout-group-nav-open')
			&& layoutgroup.children('.layout-group-nav').css("display") == "none") {
			layoutgroup.toggleClass('layout-group-nav-open');
			layoutgroup.children('.layout').removeClass('selected');
			layoutgroup.find("> .layout > .layout-body").css("margin-top", "");
		}

		if (!currentActiveLayout) {
			_setLayoutInactive(layoutgroup.children(".layout.active"));
		}
        _setLayoutActive(layoutgroup, selectedHeader);
        /* call for setting current state of open layout group tabs to hidden field*/ 
		_setHiddenField(layoutgroup, selectedHeader);
		// Change the selector for the layout pagination during transition
		var groupSelector = layoutgroup.children(" .layout-group-selector");
		if (groupSelector.length != 0) {
			var layouts = layoutgroup.children('.layout'),
			    index = layouts.index(selectedHeader.parent()),
			    currentIconSelector = groupSelector.children(".icon-selector.active");
			currentIconSelector.removeClass('active');
			var selectors = groupSelector.children(".icon-selector");
			if (selectors.length >= index && selectors[index]) {
				$(selectors[index]).addClass('active');
			}
		}

		if (layoutgroup.hasClass('layout-group-nav-open')) {
			_showHideMenu(layoutgroup);
		}
	},

    /* Used to set hidden field for maintaining current open state */
	_setHiddenField = function (layoutgroup, selectedHeader) {
  		var type = _getLayoutGroupType(layoutgroup);
      	var divWrapperLG = $(layoutgroup).closest("div[data-lg-id]");
  		var tabIndName = divWrapperLG.attr("data-lg-id");
  		var tabInd = pega.util.Dom.getElementsByName("EXPANDED"+tabIndName, divWrapperLG[0]); /* hidden field element */
  		var lgType = pega.util.Dom.getElementsByName("LGType"+tabIndName, divWrapperLG[0]); /* hidden field element for type*/
      	var index = _getIndexForSelectedLG(selectedHeader); /* index will be number and if layout type is multi accordion, number will be comma seperated 1,2,3 */
  
  		if(type == "accordion"){
    		index = _getIndexForOpenAccordians(layoutgroup);
  		}
      
  		if (tabInd != null)
      		tabInd[0].value = index;
      
      	if(lgType != null)
          	lgType[0].value = type;
  
	},
     
    /* Used to get open tabs indexes for multi selected accordion */     
	_getIndexForOpenAccordians = function (layoutgroup) {
      	/*var selectedLayout = layoutgroup.children(".layout.multiactive");*/
        var selectedLayout = layoutgroup.find(".layout .layout-body:visible");
        var arrIndex = [];
        selectedLayout.each(function() {
  			if(arrIndex.indexOf(_getIndexForSelectedLG($(this).parent())) == -1)
          		arrIndex.push(_getIndexForSelectedLG($(this).parent()));
		});
        return arrIndex.join();
	},
     
    /* Used to get index from attr from child div */
    _getIndexForSelectedLG= function (obj){
    	/*return ($(obj).closest("div.layout").prevAll().length != -1) ? $(obj).closest("div.layout").prevAll().length : 1;*/
         return ($(obj).closest("div[data-lg-child-id]").attr("data-lg-child-id") != undefined) ? $(obj).closest("div[data-lg-child-id]").attr("data-lg-child-id") : 1;
    },     
        
	/*
	 @protected select the layout - used when navigation menu is opened and keys are entered to navigate top/down - this is used to show a different style than the active style
	 @param $Object$layoutgroup   - DOM top level layout group element
	 @param $Object$selectedHeader    - DOM top level of the selected header
	 @return $void$
	*/
	_makeLayoutSelected = function(layoutgroup, selectedHeader) {
		layoutgroup.children('.layout').removeClass('selected');
		var listHeaders = layoutgroup.find('> .layout > .header');
		listHeaders.attr('tabindex', '-1');
		listHeaders.attr('aria-selected', 'true');
		selectedHeader.parent().addClass('selected');
		selectedHeader.attr('tabindex', '0');
	},

	/*
	 @protected show any menu that is currently opened
	 @return $void$
	*/
	_hideAllMenus = function() {
		$(".layout-group-nav-open").each(function(index, element) {
			_showHideMenu($(this));

		});
	},

	/*
	 @protected show or hide the navigation menu on click
	 @param $Object$layoutgroup   - DOM top level layout group element
	 @return $void$
	*/
	_showHideMenu = function(layoutgroup) {
		if (LOGGING) console.log("_showHideMenu");
		_queueDestroySwipeIndicators(layoutgroup);
		layoutgroup.toggleClass('layout-group-nav-open');
		if (layoutgroup.hasClass('layout-group-nav-open')) {
			/* Calculate the margin-top */
			var selectedLayout = layoutgroup.children(".layout.active"),
			    margintop = 0,
			    nextLayout = selectedLayout.next(".layout");
			while (nextLayout.length > 0) {
				margintop += nextLayout.children(".header").outerHeight();
				nextLayout = nextLayout.next(".layout");
			}
			selectedLayout.children(".layout-body").css("margin-top", margintop + "px");
		}
		else {
			var selectedLayout = layoutgroup.children(".layout.active");
			selectedLayout.children(".layout-body").css("margin-top", "");
			layoutgroup.children('.layout').removeClass('selected');
		}
	},

	/*
	 @protected handle keys to open the navigation menu
	 @param $Object$e- keydown event
	 @param $Object$layoutgroup   - DOM top level layout group element
	 @return $boolean$ return false if the keydown event should not be bubbled up
	*/
	_showNavigationMenu = function(e, layoutgroup) {
		if (LOGGING) console.log("_showNavigationMenu");
		/* Show navigation menu when entering enter, space or down arrow */
		if (e.keyCode == KEYBOARD.ENTER || e.keyCode == KEYBOARD.DOWN || e.keyCode == KEYBOARD.SPACE) {
			_showHideMenu(layoutgroup);
			if (layoutgroup.hasClass('layout-group-nav-open')) {
				var activeLayout = layoutgroup.children(".layout.active"),
				    selectedHeader = activeLayout.children('.header');
				_makeLayoutSelected(layoutgroup, selectedHeader);
				selectedHeader.focus();
			}
		}
		else {
			return true; // let the keydown event bubble up for tab key and other keys
		}
		return false;
	},

	/*
	 @protected handle keys entered while the navigation menu is opened
	 @param $Object$e- keydown event
	 @param $Object$headerElement - DOM header element where the keydown event happended
	 @return $boolean$ return false if the keydown event should not be bubbled up
	*/
	_handleNavigationMenuKeydown = function(e, headerElement) {
		if (LOGGING) console.log("_handleNavigationMenuKeydown");
		var currentLayout = headerElement.parent(),
		    layoutgroup = currentLayout.parent(),
		    nextLayout;
		if (e.keyCode == KEYBOARD.LEFT || e.keyCode == KEYBOARD.UP) {
			nextLayout = currentLayout.prevAll(".layout:visible").first();
			if (nextLayout.length == 0)
				nextLayout = layoutgroup.children(".layout:visible").last();
		}
		else if (e.keyCode == KEYBOARD.RIGHT || e.keyCode == KEYBOARD.DOWN) {
			nextLayout = currentLayout.nextAll(".layout:visible").first();
			if (nextLayout.length == 0)
				nextLayout = layoutgroup.children(".layout:visible").first();
		}
		else if (e.keyCode == KEYBOARD.ENTER || e.keyCode == KEYBOARD.ESCAPE || e.keyCode == KEYBOARD.TAB) {
			if (layoutgroup.hasClass('layout-group-nav-open')) {
				if (e.keyCode == KEYBOARD.ENTER) {
					_makeLayoutActive(layoutgroup, headerElement);
				}
				else {
					_showHideMenu(layoutgroup);
				}
				// it is important to set back the focus to the nav menu and not the header otherwise the next keydown event will be on the header.
				var layoutGroupNav = layoutgroup.children(".layout-group-nav:first");
				if (layoutGroupNav)
					layoutGroupNav.focus();
			}
			if (e.keyCode == KEYBOARD.TAB)
				return true; // bubble up the tab
		}
		else {
			return true; // let the keydown event bubble up for any other keys
		}
		if (nextLayout) {
			var selectedHeader = nextLayout.children('.header');
			selectedHeader[0].focus();
			if (!layoutgroup.hasClass('layout-group-nav-open')) {
				_makeLayoutActive(layoutgroup, selectedHeader);
			}
			else {
				_makeLayoutSelected(layoutgroup, selectedHeader);
			}
		}
		return false;
	},


	_initializeSwipeIndicators = function(layoutgroup, clientY) {
		if (LOGGING) console.log("_initializeSwipeIndicators");
		if (!_isTouchDevice() || !INDICATOR_ENABLED)
			return;

		// type of layout group we're in
		var lgType = _getLayoutGroupType(layoutgroup.find(" > > .content-layout-group")),
		    isMenu = 'menu' == lgType,
		    isTab = 'tab' == lgType;

		// if - we are not in "swipeable" type of LG bubble up so that vertical scrolling is allowed.
		if (!isMenu && !isTab)
			return true;

		layoutgroup=layoutgroup.hasClass("layout-body")?layoutgroup.parent():layoutgroup;
		_destroySwipeIndicators(true, layoutgroup);

		var marginTop=layoutgroup.children(".layout-body").css("margin-top");
		marginTop=marginTop.substring(0,marginTop.length-2);

		var headerHeight=0;
		if (layoutgroup.children(".layout-body").children(".content-layout-group").length > 0)
			headerHeight=parseInt(layoutgroup.children(".layout-body").children(".content-layout-group").outerHeight())+parseInt(marginTop)+8;
		else
			headerHeight=parseInt(layoutgroup.children(".layout-body").children(".content").children(".content-layout-group").outerHeight())+parseInt(marginTop)+8;

		var layouts = $(layoutgroup[0].firstChild.lastChild),
		    activeLayout = layouts.children('.active');

		$(layoutgroup).children(".layout-body")[0].style["position"]="relative";

		if (_getLayoutBeforeActive(layoutgroup).length > 0) {
			var leftIndicator = document.createElement('div');
			leftIndicator.className = 'swipe-indicator left-swipe-indicator swipe-indicator-fadein';

			leftIndicator=$(layoutgroup).children(".layout-body")[0].appendChild(leftIndicator);
			leftIndicator.style["top"] = headerHeight+"px";

			leftIndicator.classList.remove("swipe-indicator-fadein");
		}
		if (_getLayoutAfterActive(layoutgroup).length > 0) {
			var rightIndicator = document.createElement('div');	
			rightIndicator.className = 'swipe-indicator right-swipe-indicator swipe-indicator-fadein';

			rightIndicator=$(layoutgroup).children(".layout-body")[0].appendChild(rightIndicator);
			rightIndicator.style["top"] = headerHeight+"px";

			rightIndicator.classList.remove("swipe-indicator-fadein");
		}
	},

	_queueDestroySwipeIndicators = function(layoutgroup) {
		if (LOGGING) console.log("_queueDestroySwipeIndicators");
		if (!INDICATOR_ENABLED) {
			return;
        }
		// Set a timeout to accommodate CSS animations
		var swipeIndicators=layoutgroup.children(".layout-body").children(".swipe-indicator");
		if (swipeIndicators.length == 0) {
			layoutgroup = layoutgroup.parent();
			swipeIndicators = layoutgroup.children(".layout-body").children(".swipe-indicator");
		}
		if (swipeIndicators.length > 0) {
			var jsPID = window.setTimeout(_destroySwipeIndicators,500,false, layoutgroup);
			var i=0;
			while (i<swipeIndicators.length) {
				if (swipeIndicators[i].hasAttribute('data-jspid')) {
					var oldPID=swipeIndicators[i].getAttribute('data-jspid');
					window.clearTimeout(oldPID);
				}
				swipeIndicators[i].setAttribute('data-jspid', jsPID);
				swipeIndicators[i].classList.add("swipe-indicator-fadeaway");
				i=i+1;
			}
		}
	},
	_destroySwipeIndicators = function(unthreaded, layoutgroup) {
		if (LOGGING) console.log("_destroySwipeIndicators");
		// remove all elements with the swipe-indicator class
		var indicators = $(layoutgroup).children(".layout-body").children(".swipe-indicator");
		if (indicators.length == 0)
			indicators = $(layoutgroup).children(".layout-body").children(".content").children(".swipe-indicator");
		var len=indicators.length;
		var i=0;
		var numDestroyed=0;
		while (i<len)
		{
			var jsPID=indicators[i].getAttribute('data-jspid');
			if (unthreaded ==true && jsPID==null) {
				indicators[i].parentNode.removeChild(indicators[i]);
				numDestroyed=numDestroyed+1;
			}
			if (!unthreaded && jsPID!=null) {
				window.clearTimeout(jsPID);
				indicators[i].parentNode.removeChild(indicators[i]);
				numDestroyed=numDestroyed+1;
			}
			i=i+1;
		}
		if (numDestroyed == len) {
			$(layoutgroup).children(".layout-body")[0].style["position"]="";
		}
	},

	_checkForErrors = function() {
		var layoutGroupsOnPage = $(".content-layout-group");
		layoutGroupsOnPage.each(function checkLayoutForErrors() {
						if(_hasErrors($(this))) {
							_addLayoutErrorMessage($(this));
						} else {
							_clearLayoutErrorMessage($(this));
						}
					});
	},

	_hasErrors = function(layout) {
		var iconErrorDivs = layout.find(".iconErrorDiv, .inputErrorDiv");
		iconErrorDivs = iconErrorDivs.filter(pega.u.d.isDisplayNone);
		return iconErrorDivs.length > 0;
	},

	_addLayoutErrorMessage = function(layout) {
		var iconErrorDivsSize = layout.find(".iconErrorDiv, .inputErrorDiv").filter(pega.u.d.isDisplayNone).length,
			message;
		// If there are errors, create the error table if it doesn't exist and set a message
		if(iconErrorDivsSize == 1) {
			message = pega.u.d.fieldValuesList.get("Error");
		} else {
			message = pega.u.d.fieldValuesList.get("Show next error");
		}
		errorTable = layout.children(".errorText");
		if (errorTable.length == 0) {
          //Cancel the focusin event as this causes pega.u.d.focusElement to be the GoToNextError div on click in IE
			layout.prepend("<div class='errorText error-table' style='width:100%; padding:10px;border-bottom:none;'>" + message + "</div>").children(".errorText").click(_goToNextError).focusin(function(){event.cancelBubble=true;})
		} else {
			errorTable.text(message);
		}
	},

	_clearLayoutErrorMessage = function(layout) {
		layout.children(".errorText").remove();
	},

	_goToNextError = function() {
		var focusedName = $(pega.u.d.focusElement).attr("name"),
		    errorDivs = $(this).parent().find(".iconErrorDiv, .inputErrorDiv").filter(pega.u.d.isDisplayNone),
		    currentIndex = 0;
		focusedName = focusedName ? focusedName : "";
		if(_isTouchDevice() && focusedName == "") {
			focusedName = lastFocusedError;
		}
		currentIndex = errorDivs.index(errorDivs.filter("#"+focusedName.replace(/\$/g, "\\$")+"Error"))+1;
		if(currentIndex >= errorDivs.length) {
			currentIndex = 0;
		}
		_makeParentLayoutsActive(errorDivs.get(currentIndex));
		if(_isTouchDevice()) {
			lastFocusedError = errorDivs.eq(currentIndex).attr("id").replace(/Error$/g, "");
			pega.u.d.focusElement = document.getElementsByName(lastFocusedError)[0];
			pega.u.d.focusElement.scrollIntoView();
		} else {
			pega.u.d.focusDomElement(document.getElementsByName(errorDivs.eq(currentIndex).attr("id").replace(/Error$/g, ""))[0]);				
		}
	},

	_makeParentLayoutsActive = function(descendantElement) {
		var LayoutActiveArgs = [];
		//collect all the layouts 
		(function CollectParentLayouts(descendantElement) {
			while(descendantElement != null) {
				if($(descendantElement.parentNode).hasClass("content-layout-group")) {
					LayoutActiveArgs.push([$(descendantElement).parent(), $(descendantElement).children(".header")]);
				}
				descendantElement = descendantElement.parentNode;
			}
		})(descendantElement);
		$.each(LayoutActiveArgs.reverse(), function makeLayoutActiveWrapper(index, value) {_makeLayoutActive(value[0], value[1]);});
	},
    _updateStretchTabWidths = function(elem) {
    
      // if elem is null then this function runs in the document context. Otherwise it will run in the context of elem.
      var layoutGroupsOnPage = [];
      if (elem != null) {
        layoutGroupsOnPage = $(elem).find(".content-layout-group");
      } else {
        layoutGroupsOnPage = $(".content-layout-group");
      }
      layoutGroupsOnPage.each(function () {
          childCount = $(this).children(".layout:visible").length;
        
          if ($(this)[0].className.match(/count-[0-9]+/) != null) {
            // This regex replaces the word count-### at the beginning middle or end of the class string
            $(this)[0].className = $(this)[0].className.replace(/\bcount-[0-9]+\b/,"count-"+childCount);
          } else {
            $(this)[0].className += " count-"+childCount;
          }
      });
    },

        
        
	_swipe = function(callback) {
          	var touchDown = false,
              	originalPosition = null,
           		$el = $(this);

          	function swipeInfo(event) {
            	var x = event.originalEvent.pageX,
                	y = event.originalEvent.pageY,
                	dx, dy;

            	if (typeof x == 'undefined')
              		x = event.originalEvent.touches[0].pageX;
            	if (typeof y == 'undefined')
              		y = event.originalEvent.touches[0].pageY;

            	dx = (x > originalPosition.x) ? "right" : "left";
            	dy = (y > originalPosition.y) ? "down" : "up";

            	return {
              		direction: {
                		x: dx,
                		y: dy
              		},
              		offset: {
                		x: x - originalPosition.x,
                		y: originalPosition.y - y
              		}
            	};
          	}

          	$el.on("touchstart", function(event) {
            	touchDown = true;
            	if (typeof event.originalEvent.pageX != 'undefined') {
              	originalPosition = {
               		x: event.originalEvent.pageX,
                	y: event.originalEvent.pageY
              	};
            } else {
              	originalPosition = {
                	x: event.originalEvent.touches[0].pageX,
                	y: event.originalEvent.touches[0].pageY
              	};
            }

       		$("body").on("touchmove", ".layout-body[role='tabpanel']", function(event) {
              	if (!touchDown) {
                	return;
              	}
              	var info = swipeInfo(event);
              	if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
                var elem = $(this).parent(),
                	swipeEnabled,
                    lgoptions = elem.parent().data("lg-options");
                if (lgoptions) {
                  	swipeEnabled = lgoptions.swipe;
                }
                if (swipeEnabled == "true" && elem.hasClass('layout') && elem.parent().hasClass('content-layout-group')) {
                  		_swipeLayoutStart($(this), event);
                	}
              	} else {
                	$("body").off("touchmove");
        		}
            });
       	});

    	$el.on("touchend", function() {
            touchDown = false;
        	originalPosition = null;
        });
    	return true;
	},


	 /*
    @This function generates the menu by obtaining a config json and data json and highlights the menu item corresponding to the currently active/open tab.
    @return $void$
    */
  _constructTabMenu=function(event){
      var menuJSON={};
      var nodeElements=[];
      var targetElement=$(event.target);
      /*Get the menu menu config json generated from server side */
      var configElement=targetElement.parent(".layout-group-tablist-menu").attr("data-menu-config");
      if(configElement){
          var configJSON=JSON.parse(configElement);
       }
       /*activeTabId- indicates the tab that is currently open/active */
      var activeTabId=targetElement.closest(".content-layout-group").children(".active").attr("data-lg-child-id");
      /*activeMenuItem-the menu item corresponding to the currently active tab.Conatins the count */
      var activeMenuItem="";
      /* Forming the menu data json from the layout group elements that are currently visible.
      This excludes the layout group elements hidden by client side visible when*/
      var layoutGroupElement=targetElement.closest(".content-layout-group").children("[data-lg-child-id]:visible");
       layoutGroupElement.each(function(key,layoutGroupChild){

          var childId=$(this).attr("data-lg-child-id");
          if(activeTabId==childId){
            activeMenuItem= key+1;
          }
          var menuNode={};
          //menuNode["pyCaption"]=$(layoutGroupChild).find(".layout-group-item-title").text();
          menuNode["pyCaption"]=$(layoutGroupChild).children(".header").find(".layout-group-item-title").text();
          menuNode["data-click"]=[["runScript",["LayoutGroupModule.activateTabFromMenu(\""+childId+"\",event)"]]];;
          menuNode["nodes"]=[];
          menuNode["data-tab"]="abcde";
          nodeElements.push(menuNode);

       });
       /*Obtaining the menu id from the hidden input field that contains a unique name attribute for each layout group */
      var menuId=targetElement.closest(".content-layout-group").attr("data-lg-id");
      if(!menuId)
         menuId=targetElement.closest(".content-layout-group").parent().attr("data-lg-id");
       menuJSON["menuid"]=menuId;
       menuJSON["nodes"]=nodeElements;
       /* Set the showMenuTarget to override the events target in case of action executed on a menu item.
        This is to execute the action in the context of the section.*/
      pega.control.menu.showMenuTarget=targetElement[0];
      /*Construct and render Menu*/
	   if($("#"+menuId)){
		   $("#"+menuId).remove();
	   }
      pega.control.menu.createAndRenderContextMenu(menuJSON, configJSON, targetElement, event);
      /*Highlighting the menu item that corresponds to currently active/open tab in the layout group */
      $("#"+menuId+">li").removeClass("activeTab");
      $("#"+menuId+">li:nth-child("+activeMenuItem+")").addClass("activeTab");
	},

		/*
		@This function constructs the menu and shows the menu icon in the active state. 
		Also ensures that the icon goes to the inactive state when the menu is closed. 
		@return $void$
		*/
	  _showActiveTabListMenu=function(event){  
		  var targetElement=$(event.target);      
		  /*Construct menu from the client side */
		  _constructTabMenu(event);

		   /*Show the menu icon in the active state. */
		  targetElement.addClass("activeTabMenuIcon");
		  targetElement.parent(".layout-group-tablist-menu").addClass("activeTabMenu");
		 
		  /*Executed only once after which it is unbound. Shows the menu icon in the inactive state once the menu is hidden*/
		  $(document.body).one("click.bodyone,touchend.bodyone",function(){
			targetElement.removeClass("activeTabMenuIcon");
			targetElement.parent(".layout-group-tablist-menu").removeClass("activeTabMenu");
		  });
		},
	   /*
		@This function ensures that the appropriate tab becomes active when a menu item is clicked upon.
		@return $void$
		*/
	 _activateTabFromMenu=function(tabId, event, calledFrom, oneLGRef, nestedLG){	
      	if(calledFrom == "reload"){
          	//var $AllLGRefs = $(".layout-group-tab[role='tablist']");
			//$AllLGRefs.each(function(i, layoutgroup){
          		if(!nestedLG)
          			var type = _getLayoutGroupType([oneLGRef]);
          		else
                	var type = _getLayoutGroupType([oneLGRef.children[0]]);
          		if(type == "tab" && !_toDisableSlideOnTabsClick(oneLGRef)){
					
					//$(oneLGRef).find("[data-lg-child-id="+tabId+"]").find(".layout-group-item-title").trigger("click");
                  	if(!nestedLG)
                  		$(oneLGRef).children("[data-lg-child-id="+tabId+"]").children(".header").find(".layout-group-item-title").trigger("click");
                  	else
                    	$([oneLGRef.children[0]]).children("[data-lg-child-id="+tabId+"]").children(".header").find(".layout-group-item-title").trigger("click");
					
                  	if(tabId==1){      	
						if(nestedLG)
                          	$(oneLGRef).children().children(".tab-arrow.left-arrow").addClass("tab-arrow-inactive");
                      	else
                        	$(oneLGRef).children(".tab-arrow.left-arrow").addClass("tab-arrow-inactive");
                      	//$(oneLGRef).find(".tab-arrow.left-arrow").addClass("tab-arrow-inactive");
                    	$(oneLGRef).attr("data-reachedBeginning","true");
					} 
		 		}	           
        	//});
        } else{
        	var targetElement=$(event.target);
			var layoutGroupElement=targetElement.closest(".content-layout-group");
          	if(tabId==1){
              	layoutGroupElement.find(".tab-arrow.left-arrow").addClass("tab-arrow-inactive");
				layoutGroupElement.attr("data-reachedBeginning","true");
			}         
          	var $headerSectionWrapper = layoutGroupElement.children("[data-lg-child-id="+tabId+"]");
          	if(!$headerSectionWrapper.next().attr("data-lg-child-id")){
              	layoutGroupElement.find(".tab-arrow.right-arrow").addClass("tab-arrow-inactive");	
            }
          	var activeTab = _getActiveTabElement(layoutGroupElement);
          
          	layoutGroupElement.attr("data-topCalculateBeforeScroll", activeTab.next().offset().top - $(document).scrollTop())
          	//topCalculateBeforeScroll = activeTab.next().offset().top - $(document).scrollTop(); 
			if (_isTouchDevice()) {
				$headerSectionWrapper.children(".header").find(".layout-group-item-title").trigger("touchstart").trigger("click"); 	
              //$headerSectionWrapper.find(".layout-group-item-title").trigger("touchstart").trigger("click"); 
			}else{
              	$headerSectionWrapper.children(".header").find(".layout-group-item-title").trigger("click"); 
          		//$headerSectionWrapper.find(".layout-group-item-title").trigger("click"); 
			}
          	
        }      	
	},
        
    _resizeActions = function(){
      	//var $AllLGRefs = $(".layout-group-tab[role='tablist']");
      	var $AllLGRefs = $(".tab-overflow");
      	$AllLGRefs.each(function(i, layoutgroup){
        	if(!$(layoutgroup).hasClass("stretch-tabs")){
              var type = _getLayoutGroupType([layoutgroup]);
              if(type == "tab" && !_toDisableSlideOnTabsClick(layoutgroup) && !_isParentOverlay($(layoutgroup))){
                  $(this).children(".left-tab-nav-controls").css("display","inline-block");
                  $(this).children(".right-tab-nav-controls").css("display","block");	
                  /*$(this).find('div[data-lg-child-id]').find('.header').css("padding","1em 0 0 0");*/
                  var marginBeforeResize = $(layoutgroup).attr("data-marginBeforeResize");
                  $(this).find("[role='tab']:first").css("transition", "margin-left 0.3s linear");	
                  if(marginBeforeResize != 0)
                      $(this).find("[role='tab']:first").css("marginLeft", marginBeforeResize+"px");
                  else
                      $(this).find("[role='tab']:first").css("marginLeft", "2em");

                  setTimeout( function(){
                      var activeTab = _getActiveTabElement($(layoutgroup));
                      /*if(!_isSelectedHeaderBetweenTheTwoArrows(activeTab, $(layoutgroup).children(".left-tab-nav-controls"), $(layoutgroup).children(".right-tab-nav-controls"))){ */     
                      if(!_isActiveTabBetweenTheTwoArrows(activeTab,  $(layoutgroup).children(".right-tab-nav-controls"))){
                          //activeTab.next().attr('style',"margin-top:"+(currentMarginForSection+currentTabHeight)+"px !important");
                        	activeTab.next().css("margin-top", (currentMarginForSection+currentTabHeight)+"px !important");
                      } else{          			
                          //activeTab.next().attr('style',"margin-top:"+(currentMarginForSection)+"px !important");
                        	activeTab.next().css("margin-top", (currentMarginForSection+currentTabHeight)+"px !important");
                      }
                  }, 300);
				  /* BUG-267058 start */	
                  LayoutGroupModule.updateLayoutHeight($(layoutgroup));
                  /* BUG-267058 end */

              }else{
                  $(this).parent().removeClass("container-scroll");
                  $(this).removeClass("tab-overflow");
                  $(this).children(".left-tab-nav-controls").css("display","none");
                  $(this).children(".right-tab-nav-controls").css("display","none");
                  $(this).find('div[data-lg-child-id]').find('.header').css("padding","0");
                  $(this).find("[role='tab']:first").css("transition","none").css("marginLeft", "0");	
              }  	           
          }
        });
	},
    
    _toDisableSlideOnTabsClick = function(oneLGRef){
        var totalTabWidth = 0;
        var i = 0;
      	var dataLgId = $(oneLGRef).attr("data-lg-id");
      	if(!dataLgId)
      		dataLgId = $(oneLGRef).parent().attr("data-lg-id");      	          
        $(oneLGRef).find("[role='tab']").each(function(){
          	if($(this).closest("[data-lg-id]").attr("data-lg-id") == dataLgId){
                if(i==0){
                    totalTabWidth += $(this).outerWidth();
                    totalTabWidth += parseInt($(this).css("marginRight"));
                } else{
                    totalTabWidth += $(this).outerWidth(true);
                }
                i++;
            }
        });
        if(parseInt(totalTabWidth)>$(oneLGRef).width()){
            return false;
        } else{
            return true;
        }
    },
   
    _getActiveTabElement = function($LGRef){
        var activeTab;
        $LGRef.find("[role='tab']").each(function(){
          //if($(this).attr('tabindex') == 0){
          if($(this).parent().hasClass("active")){
            activeTab = $(this);
            return false;
          }
        });
        return activeTab;
    }, 
    
    _onLoadAttachEvent = function(){
    	pega.u.d.attachOnload(
    		function(){
    			//var $AllLGRefsOnPage = $(".layout-group-tab[role='tablist']");
              	var $AllLGRefsOnPage = $(".tab-overflow");
              	if(!$AllLGRefsOnPage.attr("data-eventsAdded")){
        			$AllLGRefsOnPage.attr("data-eventsAdded","true");
          			$AllLGRefsOnPage.find(".tab-arrow.left-arrow, .tab-arrow.right-arrow").click(_toSlideTabsWrapper);
        			/*$AllLGRefsOnPage.find(".tab-arrow.left-arrow, .tab-arrow.right-arrow").mousedown(function(evt){
            			evt.target.tabHeadingsSliderIntervalId = setInterval(_slideTabHeadingsOnDesktop, 300, evt);
        			}).mouseup(function(evt){
            			clearInterval(evt.target.tabHeadingsSliderIntervalId);
        			}); commenting as this was not working as expected */ 
                	var i = 0;	
               		$($AllLGRefsOnPage.get().reverse()).each(function(i, oneLGRef){
                  	//$AllLGRefsOnPage.each(function(i, oneLGRef){
                      	var divWrapperLG = $(oneLGRef).closest("div[data-lg-id]");
  						if(!divWrapperLG.hasClass("stretch-tabs") && !_isParentOverlay($(oneLGRef)) && $(oneLGRef).is(":visible")){
                            var tabIndName = divWrapperLG.attr("data-lg-id");
                            var tabInd = pega.util.Dom.getElementsByName("EXPANDED"+tabIndName, divWrapperLG[0]);
                          	var nestedLayout = ($(oneLGRef).hasClass('tab-overflow') && (_getLayoutGroupType($(oneLGRef.children)) == 'tab'));
                            if(!_toDisableSlideOnTabsClick(oneLGRef) && (_getLayoutGroupType($(oneLGRef)) == 'tab' || nestedLayout)){
                           		if(!nestedLayout){
                                  	divWrapperLG.addClass("tab-overflow");
                                	divWrapperLG.parent().addClass("container-scroll");
                                	divWrapperLG.children(".left-tab-nav-controls").css("display","inline-block");
                                	divWrapperLG.children(".right-tab-nav-controls").css("display","block");

                            	} else{                              
                                	// container-scroll   
                                	divWrapperLG.parent().removeClass("container-scroll");

                                	// tab-overflow  
                                	divWrapperLG.removeClass("tab-overflow"); 
                                	divWrapperLG.addClass("container-scroll");                            

                                	// inner div nested  
                                	divWrapperLG.children().addClass("tab-overflow");                        

                                	divWrapperLG.find(".left-tab-nav-controls").css("display","inline-block");
                                	divWrapperLG.find(".right-tab-nav-controls").css("display","block");                                        
                            	}

                              	if(tabInd != null && tabInd[0].value != 1){
                                    LayoutGroupModule.activateTabFromMenu(tabInd[0].value, event, "reload", oneLGRef, nestedLayout);
                                } else{
                                    if(!nestedLayout)
                                  		$(oneLGRef).children(".tab-arrow.left-arrow").addClass("tab-arrow-inactive");
                                  	else
                                      	$(oneLGRef).children().children(".tab-arrow.left-arrow").addClass("tab-arrow-inactive");
                                }
                              	
                              
                                oneLGRef.initialOnLoadHeight = parseInt($(oneLGRef).parent().height());
                                //$(oneLGRef).parent().height(oneLGRef.initialOnLoadHeight + parseInt($(oneLGRef).height()));
                                $(oneLGRef).parent().height(oneLGRef.initialOnLoadHeight);
                              	
                              	_updateLayoutHeight($(oneLGRef), false, nestedLayout);
                            } else{
                                divWrapperLG.removeClass("tab-overflow");
                                divWrapperLG.parent().removeClass("container-scroll");
                                divWrapperLG.parent().css("height", "");
                              	if(!nestedLayout){
									divWrapperLG.children(".left-tab-nav-controls").css("display","none");
                                    divWrapperLG.children(".right-tab-nav-controls").css("display","none");                                              
                            	} else{
                                	divWrapperLG.find(".left-tab-nav-controls").css("display","none");
                                    divWrapperLG.find(".right-tab-nav-controls").css("display","none");  
                            	}
                            }

                            if(i==0){
                                var activeTab = _getActiveTabElement($(oneLGRef));
                                /*currentMarginForSection = parseInt(activeTab.next().css("marginTop"));*/
                                currentMarginForSection = 0;                          	
                                /*BUG-267745 & BUG-267377-No active tab exists in this case and below line gives a JS error. */
                                currentTabHeight = activeTab?activeTab.outerHeight(true):0;	
                            }                  
                    	}else {divWrapperLG.removeClass("tab-overflow"); divWrapperLG.parent().removeClass("container-scroll"); divWrapperLG.find("[role='tab']:first").css("transition", "none").css("marginLeft", "0");/*BUG-268041 arrow none*/divWrapperLG.children(".left-tab-nav-controls").css("display","none");}
                	});	                                
      			}
              	_initializeLayoutGroupToRemoveScrollClass();
			}      	
		, true);
    },
    
    _toSlideTabsWrapper = function(evt){
      	if(flagToStopEvent)
          	_slideTabHeadingsOnDesktop(evt);
      	
    },
      
    _slideTabHeadingsOnDesktop = function(evt){
      	flagToStopEvent = false;
      	//var $LGRef = $(evt.target).parents("[role='tablist']");
      	var $LGRef = $(evt.target).closest("[role='tablist']");
        var deltaDistanceToShiftTabsBy = defaultDeltaDistanceToShiftTabsBy;
        var $LGFirstTabHeadingRef = $LGRef.find("[role='tab']:first");
      	//var $leftTabNavControls = $LGRef.find(".left-tab-nav-controls"),
        //$rightTabNavControls = $LGRef.find(".right-tab-nav-controls");	
		
      	var $leftTabNavControls = $LGRef.children(".left-tab-nav-controls"),
        $rightTabNavControls = $LGRef.children(".right-tab-nav-controls"); 
        var nestedLG = false;
       	if($leftTabNavControls && $leftTabNavControls.length == 0){
        	nestedLG = true;
          	$leftTabNavControls = $LGRef.find(".left-tab-nav-controls"),
            $rightTabNavControls = $LGRef.find(".right-tab-nav-controls"); 
        }
      	
      	var viewPortWidth = parseInt($rightTabNavControls.position().left) - $leftTabNavControls.outerWidth();
      	
      	var reachedBeginning = ($LGRef.attr("data-reachedBeginning") == "true") ? true : false;
      	var currentMargin = parseInt($LGFirstTabHeadingRef.css("margin-left")) || 0;
        //if(reachedBeginning) {
          	//initialMarginForArrows = parseInt($LGFirstTabHeadingRef.css("margin-left")) || 0;
          	initialMarginForArrows = $leftTabNavControls.outerWidth();
        //}

      	if($(evt.target).hasClass("right-arrow")){
          	var visibleTabLength = 0;
           	if(reachedBeginning){ 
             	var dataLgId = $LGRef.attr("data-lg-id");
                $LGRef.find("[role='tab']").each(function(){
                    if($(this).closest("[data-lg-id]").attr("data-lg-id") != dataLgId)
                      return;
                  	visibleTabLength += $(this).outerWidth(true);
                  	if((visibleTabLength-initialMarginForArrows+1) >= viewPortWidth){
                    	deltaDistanceToShiftTabsBy = visibleTabLength-viewPortWidth-initialMarginForArrows;
                    	return false;
                	}
           		});
           	} else{
              	visibleTabLength = Math.abs(currentMargin);
            	var wentInIf = false;
               	var dataLgId = $LGRef.attr("data-lg-id");
                $LGRef.find("[role='tab']").each(function(){
                    if($(this).closest("[data-lg-id]").attr("data-lg-id") != dataLgId)
                      return;
                  	visibleTabLength += $(this).outerWidth(true);
                    if(visibleTabLength > (viewPortWidth+Math.abs(currentMargin)+initialMarginForArrows)){
                      	if(wentInIf || (-10 < (visibleTabLength - (viewPortWidth + initialMarginForArrows +  Math.abs(currentMargin) + $(this).outerWidth(true))) &&  (visibleTabLength - (viewPortWidth + initialMarginForArrows +  Math.abs(currentMargin) + $(this).outerWidth(true))) < 10))
                       		deltaDistanceToShiftTabsBy = Math.abs($(this).outerWidth(true));
                      	else
                            deltaDistanceToShiftTabsBy = Math.abs(visibleTabLength - Math.abs(currentMargin) - initialMarginForArrows - viewPortWidth);
                      	/* special handling, code to remove minor movement */
              			if(parseInt(deltaDistanceToShiftTabsBy) < 5 && $(this).parent().next().find(".header"))
                          	deltaDistanceToShiftTabsBy += Math.abs($(this).parent().next().find(".header").outerWidth(true));
                      	if(!$(this).parent().next().attr("data-lg-child-id"))
                          	$rightTabNavControls.find(".right-arrow").addClass("tab-arrow-inactive");
                      	return false;
                    } else if(Math.abs(visibleTabLength) == (viewPortWidth+Math.abs(currentMargin)+initialMarginForArrows)){
                      	wentInIf = true;
                    }
           		});
            }

          	$leftTabNavControls.removeClass("tab-arrow-inactive");
          	$LGRef.attr("data-reachedBeginning","false");
        } else if($(evt.target).hasClass("left-arrow")){
          	var hiddenTabLength = Math.abs(currentMargin);
            var prevChild = "";
          	var i = 0;
           	var dataLgId = $LGRef.attr("data-lg-id");
            $LGRef.find("[role='tab']").each(function(){
            	if($(this).closest("[data-lg-id]").attr("data-lg-id") != dataLgId)
               		return;
            	hiddenTabLength += $(this).outerWidth(true);
              	i++;
              	if(hiddenTabLength >= (Math.abs(currentMargin)+initialMarginForArrows)){
                	if(isTabCoveredByLeftArrow($(this), $leftTabNavControls)){
                      	deltaDistanceToShiftTabsBy = $(this).outerWidth(true) - (hiddenTabLength - (Math.abs(currentMargin)+initialMarginForArrows));
                    } else if(prevChild != ""){
                        deltaDistanceToShiftTabsBy = $(prevChild).outerWidth(true);
                    } else{
                      	deltaDistanceToShiftTabsBy = defaultDeltaDistanceToShiftTabsBy;
                    } 
                  	/* special handling, code to remove minor movement */
                  	if(parseInt(deltaDistanceToShiftTabsBy) < 5 && $(this).parent().prev().find(".header"))
                          	deltaDistanceToShiftTabsBy += Math.abs($(this).parent().prev().find(".header").outerWidth(true));
                	return false;
              	}
              	prevChild = this;
        	});
          	if(i == 1){ /* case one only tab left hidden */
            	deltaDistanceToShiftTabsBy = $LGFirstTabHeadingRef.outerWidth()	+ initialMarginForArrows;
          	}
          	//$rightTabNavControls.find(".right-arrow").css("opacity", "1");
          	$rightTabNavControls.find(".right-arrow").removeClass("tab-arrow-inactive");
        }
      	
      	function computeSafeNewMarginLeftForFirstTab(incomingComputedMargin){
          	var totalAllTabHeadingsWidth = 0;
                var dataLgId = $LGRef.attr("data-lg-id");
            $LGRef.find("[role='tab']").each(function(){
            	if($(this).closest("[data-lg-id]").attr("data-lg-id") != dataLgId)
               		return;
              	totalAllTabHeadingsWidth += $(this).outerWidth();
            });
            var minMarginLeft = -(
              						totalAllTabHeadingsWidth 
              						+ $leftTabNavControls.position().left 
              						+ $leftTabNavControls.outerWidth(true) 
              						- $rightTabNavControls.position().left 
              						+ $rightTabNavControls.outerWidth(true)
            					 );
          	var maxMarginLeft = $leftTabNavControls.outerWidth(true);
          	if((minMarginLeft <= incomingComputedMargin) && (incomingComputedMargin <= maxMarginLeft))
              	return incomingComputedMargin;
            else if(incomingComputedMargin < minMarginLeft){
              	//$rightTabNavControls.find(".right-arrow").css("opacity", "0.3");
              	$rightTabNavControls.find(".right-arrow").addClass("tab-arrow-inactive");
              	return minMarginLeft;
            } else{ /*else if(incomingComputedMargin > maxMarginLeft)*/
              	$LGRef.attr("data-reachedBeginning","true");
              	//$leftTabNavControls.css("opacity", "0.3");
          		$leftTabNavControls.addClass("tab-arrow-inactive");
              	return maxMarginLeft;
            }
        }
     
      	function __L($el){
            return (
              (parseInt($el.css("margin-left")) || 0)
              +
              $el.position().left
            );
	  	}	
      
      	function isTabCoveredByLeftArrow(selectedHeader, $leftTabNavControls) {
            return(
              __L(selectedHeader)+1 < ($leftTabNavControls.position().left + $leftTabNavControls.outerWidth(true))
            );
        }
      	      	    	
      
        var newMargin = ( $(evt.target).hasClass("left-arrow") ? (currentMargin + deltaDistanceToShiftTabsBy) : (currentMargin - deltaDistanceToShiftTabsBy) );
      	
      	newMargin = computeSafeNewMarginLeftForFirstTab(newMargin);
       	//marginBeforeResize = newMargin;
      	$LGRef.attr("data-marginBeforeResize", newMargin);
      	var activeTab = _getActiveTabElement($LGRef);
      	if(!_isSelectedHeaderBetweenTheTwoArrows(activeTab, $leftTabNavControls, $rightTabNavControls))
      		_setSectionTransitionAttribute(activeTab, $LGRef, "", nestedLG);
      	
      	$LGFirstTabHeadingRef.css("margin-left", newMargin+"px");       

      	if(!_isSelectedHeaderBetweenTheTwoArrows(activeTab, $leftTabNavControls, $rightTabNavControls))
      		_resetSectionTransitionAttribute(activeTab, $LGRef, currentMarginForSection, currentTabHeight, $rightTabNavControls, $LGFirstTabHeadingRef, nestedLG);
      
      	flagToStopEvent = true;
    },
    
    _L = function($el){
            return (
              (parseInt($el.css("margin-left")) || 0)
              +
              $el.position().left
            );
    },
        
    _isActiveTabBetweenTheTwoArrows = function(selectedHeader, $rightTabNavControls) {
        if(_isTabCoveredByRightArrow(selectedHeader, $rightTabNavControls)){
          	return true;
        } else if(_L(selectedHeader) > 0  && Math.abs(_L(selectedHeader))+selectedHeader.outerWidth() <= $rightTabNavControls.position().left){
          	return true;              
        } else if(_L(selectedHeader) <= 0 && Math.abs(_L(selectedHeader)) <= selectedHeader.outerWidth()){
          	return true;
        } else {
          	return false;
        }          
     },
      
     _isTabCoveredByRightArrow = function(selectedHeader, $rightTabNavControls) {
            return(
              (_L(selectedHeader) + selectedHeader.outerWidth()) > $rightTabNavControls.position().left
            );
     }, 
     
     _isSelectedHeaderBetweenTheTwoArrows = function(selectedHeader, $leftTabNavControls, $rightTabNavControls) {
           	return(
				(_L(selectedHeader) >= ($leftTabNavControls.position().left + $leftTabNavControls.outerWidth(true)))
					&&
				((_L(selectedHeader) + selectedHeader.outerWidth()) <= $rightTabNavControls.position().left)
			);
     },
        
    _setSectionTransitionAttribute = function(activeTab, $LGRef, calledFrom, nestedLG){
      	if(calledFrom == "fromMenu")
          	var topSectionDiv = $LGRef.attr("data-topCalculateBeforeScroll");
        else
      		var topSectionDiv = activeTab.next().offset().top - $(document).scrollTop();
        var leftSectionDiv = activeTab.next().offset().left - $(document).scrollLeft(),
        widthSectionDiv = activeTab.next().width();
      	activeTab.next().addClass("transition-position");
      	//if(!(navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1))
      		activeTab.next().css({top: topSectionDiv+"px", left: leftSectionDiv+"px", marginTop:""});
      	 /*else{
          	activeTab.next().css({top: topSectionDiv+"px", left: leftSectionDiv+"px"});
         	activeTab.next().css("margin-top","");
         }*/
      	//activeTab.next().height(activeTab.next().height());
      	activeTab.next().width(widthSectionDiv);
      	if(!nestedLG)
      		$LGRef.height($LGRef.parent().height());
      	//$LGRef.height(parseInt(activeTab.next().css('height'))+topSectionDiv);
      	$LGRef.width($LGRef.parent().width());   
    },
        
    _resetSectionTransitionAttribute = function(activeTab, $LGRef, currentMarginForSection, currentTabHeight, $rightTabNavControls, $LGFirstTabHeadingRef, nestedLG){
      	//setTimeout( function(){ 
        $LGFirstTabHeadingRef.one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){ 
          	if(!_isActiveTabBetweenTheTwoArrows(activeTab, $rightTabNavControls)){
          		//activeTab.next().css("marginTop", (currentMargin+currentTabHeight)+"px");
          		activeTab.next().attr('style',"margin-top:"+(currentMarginForSection+currentTabHeight)+"px !important");
        	} else{
          		//activeTab.next().css("marginTop", (currentMargin-currentTabHeight)+"px");
         		activeTab.next().attr('style',"margin-top:"+(currentMarginForSection)+"px !important");
        	}
            activeTab.next().removeClass("transition-position");
          	activeTab.next().css('height', '');
      		activeTab.next().css('width', '');
          	if(!nestedLG)
          		$LGRef.css('height', '');
          	$LGRef.css('width', '');
        //}, 300);
    	});
      	$LGRef.attr("data-topCalculateBeforeScroll",0);
    },
    
    _initializeLayoutGroupToRemoveScrollClass = function(){
      	var $AllTypeLGRefsOnPage = $(".content-layout-group[role='tablist']");
      	//BUG-267736 display:none for tab-indicator
      	$AllTypeLGRefsOnPage.find(".tab-indicator").css("display", "none");
      	$AllTypeLGRefsOnPage.each(function(i, oneLGRef){
        	if(_getLayoutGroupType($(oneLGRef)) != 'tab'){         	
            	var divWrapperLG = $(oneLGRef).closest("div[data-lg-id]");
              	if(!divWrapperLG.hasClass("stretch-tabs")){
              	divWrapperLG.removeClass("tab-overflow");
              	divWrapperLG.parent().removeClass("container-scroll");
              	divWrapperLG.parent().css("height", "");
              	divWrapperLG.attr("data-topCalculateBeforeScroll",0);
              	divWrapperLG.attr("data-marginBeforeResize",0);
              	divWrapperLG.children(".left-tab-nav-controls").css("display","none");
              	divWrapperLG.children(".right-tab-nav-controls").css("display","none");
                } else{divWrapperLG.parent().removeClass("container-scroll");divWrapperLG.find("[role='tab']:first").css("transition", "none").css("marginLeft", "0");}
            }
        });      	
    },
      
   	_isParentOverlay = function($LGRef){
      	if($LGRef.parents("#_popOversContainer").length != 0) return !0; else return false;
    },
        
	/*
	 @protected Initialize the layout group handlers
	 @return $void$
	*/
	_initializeLayoutGroup = function() {
		// Test if jquery is loaded.
		if (window.$) {
			$(document).ready(
				function() {
                    _updateStretchTabWidths();					
					/* temporary function to make !tab layout to remove certain classes */
                  	if (!_isTouchDevice())
                  		_initializeLayoutGroupToRemoveScrollClass();
					if (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) {
						if (window.PointerEvent) {
							touchStart = "pointerdown";
							touchMove = "pointermove";
							touchEnd = "pointerup";
							touchCancel = "pointercancel";
							touchOut = "pointerout";
						}
						else if (window.MSPointerEvent) {
							touchStart = "MSPointerDown";
							touchMove = "MSPointerMove";
							touchEnd = "MSPointerUp";
							touchCancel = "MSPointerCancel";
							touchOut = "MSPointerOut";
						}
					}

					touchBindEvents = touchMove + " " + touchEnd + " " + touchCancel + " " + touchOut;
					_setBrowserPrefix();
					if(!$("body").attr("data-lgclickregiestered")){
					$("body").attr("data-lgclickregiestered","true");
					$("body").bind(
						"keydown click touchstart",
						function lgMainHandler(e) {
                         	// flag busy to perf mon
                          	pega.ui.statetracking.setActionBusy("lgMainHandler", e.timeStamp);
                          	var rt = null; 			// small refactoring below would cleanup this

							var elem = null;
							if (e.type == "keydown")
								elem = $(e.target);
							else { /* BUG-238699:Layout Group tab appears clickable but does not switch tab */
                              	if((e.target.tagName.toUpperCase() == 'DIV') && (e.target.className.split(' ').indexOf("header") > -1))
                                  	elem = $(e.target);
                              	else
                              		elem = $(e.target).parent();
                            }
							if (elem.hasClass("layout-group-item-title") || elem.hasClass("layout-group-nav-title"))
								elem = elem.parent();
							if (elem.hasClass('header') && elem.parent().hasClass('layout')
								&& elem.parent().parent().hasClass('content-layout-group')) {
								if (e.type == "keydown") {
									rt = _handleNavigationMenuKeydown(e, elem);
                            		pega.ui.statetracking.setActionDone();
									return rt;
								}
								else {
                                  	if(e.type != "touchstart"){
									_makeLayoutActive(elem.parent().parent(), elem);
                            		pega.ui.statetracking.setActionDone();
                                    }
									return true; /* US-104283 Actions on Layout Groups */
								}
							}
							else if (elem.hasClass('layout-group-nav')
								&& elem.parent().hasClass('content-layout-group')) {
								if (e.type == "keydown") {
									rt = _showNavigationMenu(e, elem.parent());
                            		pega.ui.statetracking.setActionDone();
									return rt;
								}
								else {
									if (elem.children(".layout-group-nav-title").children(".icon-openclose:visible").length > 0) {
										_showHideMenu(elem.parent());
									}
                            		pega.ui.statetracking.setActionDone();
									return false;
								}
							}
							if (e.type == "click" || e.type == "touchstart")
								_hideAllMenus(); // for any click event that will close the menu automatically

                       		pega.ui.statetracking.setActionDone();
							return true;
						});
					}
					if (_isTouchDevice()) {
                        _swipe();
						$("body").addClass('touchable');
                      	/*TabOverflowSpike START*/
                      	if(false){ /* Currently not needed only for desktop */
                        function __slideTabHeadings($LGRef, deltaDistanceToShiftTabsBy){

                            var $LGFirstTabHeadingRef = $LGRef.find("[role='tab']:first");

                            var currentMargin = parseInt($LGFirstTabHeadingRef.css("margin-left")) || 0;

                            function computeSafeNewMarginLeftForFirstTab(incomingComputedMargin){
                                var totalAllTabHeadingsWidth = 0;
                                $LGRef.find("[role='tab']").each(function(){
                                  	totalAllTabHeadingsWidth += $(this).outerWidth();
                                });
                                var minMarginLeft = -(
                                                        totalAllTabHeadingsWidth
                                                        - $LGRef.outerWidth(true)
                                                     );
                                var maxMarginLeft = 0;
                                if((minMarginLeft <= incomingComputedMargin) && (incomingComputedMargin <= maxMarginLeft))
                                    return incomingComputedMargin;
                                else if(incomingComputedMargin < minMarginLeft)
                                    return minMarginLeft;
                                else /*else if(incomingComputedMargin > maxMarginLeft)*/
                                    return maxMarginLeft;
                            }

                            var newMargin = currentMargin + deltaDistanceToShiftTabsBy;

                            newMargin = computeSafeNewMarginLeftForFirstTab(newMargin);

                            $LGFirstTabHeadingRef.css("margin-left", newMargin+"px");
                        }
                      	
                      	$("body").on(touchStart+" "+touchMove+" "+touchEnd, ".layout-group-item-title, [role='tab'], [data-lg-child]", function lgTabHeadingsSwipeHandler(e) {
                            var $LGRef = $(e.target).parents("[role=tablist]");
        
        					var LGFirstTabHeading = $LGRef.find("[role='tab']:first").get(0);

                            var type = _getLayoutGroupType($LGRef);

                            if(type != "tab")
                              	return true;
                          
                          	var touchPos = _getTouchPoint(e);
                          	
                          	if (e.type == touchStart) {
                              	/* store starting coordinates */
                              	LGFirstTabHeading.xDown = touchPos.X;
                            }
                            else if (e.type == touchMove) {
                                if ( ! LGFirstTabHeading.xDown ) {
                                    return true;
                                }

                                var xUp = touchPos.X;

                                var xDeltaDistanceToShiftTabsBy = xUp - LGFirstTabHeading.xDown;
                              	
                                /* console.info("lgTabHeadingsSwipeHandler : swipe on tab headings by ", xDeltaDistanceToShiftTabsBy); */
                              	
                                __slideTabHeadings($LGRef, xDeltaDistanceToShiftTabsBy);
                            }
                            else if (e.type == touchEnd) {   
                                /* reset coordinates after one set of [1 touchstart, multiple touchmoves and 1 touchend] occurs*/
                                LGFirstTabHeading.xDown = null;
                                LGFirstTabHeading.yDown = null;
                            }
                          	
                            return true;
                            
						});
                        }
                        /*TabOverflowSpike END*/
					}
					
                  	/* For hiddening arrows on breakpoints */
                  	if (!_isTouchDevice()){
                  		pega.u.d.registerResize(_resizeActions);
                  		_onLoadAttachEvent();					
                    }
                  	_checkForErrors();
				});
		}
		else {
			/* We could wait 50 milliseconds and try again using window.setTimeout( initializeLayoutGroup, 50 ); - instead we log an error */
			alert("Layout group could not be initialized.");
		}
	};

	/*\
	|*|
	|*| Bind event handlers and other load processes
	|*|
	\*/

	_initializeLayoutGroup();

	/*\
	|*|
	|*| Public methods
	|*| Return one anonymous object literal that would expose privileged methods.
	|*|
	\*/

	return {
		/*
		@public this function willset this layoutElement to active - used by visible when on client (see pzpega_ui_doc_EventsConditionsChaining.js)
		@return $void$
		*/
		setLayoutActive : function(layoutElement) {
			var selectedHeader = $(layoutElement).children(".header"),
			    layoutgroup = $(layoutElement).parent();
			_setLayoutActive(layoutgroup, selectedHeader);
		},

		setLayoutInactive : function(layoutElement) {
			_setLayoutInactive($(layoutElement));
		},

		checkForErrors : function() {
			_checkForErrors();
		},
      
		updateStretchTabWidths : function() {
            _updateStretchTabWidths();
		},
		
		showActiveTabListMenu:function(event){
			_showActiveTabListMenu(event);
		},
      
		activateTabFromMenu:function(tabId, event, calledFrom, oneLGRef, nestedLG){
			_activateTabFromMenu(tabId, event, calledFrom, oneLGRef, nestedLG);
		},
      	/* BUG-267058 Start */
      	getLayoutGroupType: function(layoutgroup){	 
      		return _getLayoutGroupType(layoutgroup);
        },
      
      	getActiveTabElement: function(layoutgroup){      
    	 	return _getActiveTabElement($(layoutgroup)); 
    	},
      
      	updateLayoutHeight: function(layoutgroup){
          	/*var type = this.getLayoutGroupType(layoutgroup);          	 
          	if(!layoutgroup.hasClass("stretch-tabs") && type == 'tab'){*/
        		var selectedHeader = this.getActiveTabElement(layoutgroup);  
              	_updateLayoutHeight(layoutgroup, selectedHeader);
            /*}*/
      	}
      	/* BUG-267058 End */
	};
})(pega);