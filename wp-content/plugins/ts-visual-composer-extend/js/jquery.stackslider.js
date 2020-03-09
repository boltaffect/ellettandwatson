/**
 * jquery.stackslider.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2012, Codrops
 * http://www.codrops.com
 */
;( function( $, window, undefined ) {
	'use strict';
	
	// global
	var $window = $(window),
		$document = $(document),
		Modernizr = window.Modernizr;

	$.StackSlider = function( options, element ) {	
		this.$stack = $(element).hide();
		this._init(options);
		this.$maxPileHeight = 0;
	};

	// the options
	$.StackSlider.defaults = {
		// default transition speed
		speed : 		600,
		// default transition easing
		easing : 		'ease-in-out',
		// render both piles
		piles : 		true,
		// adjust stack height automatically
		autoheight :	true,
	};

	$.StackSlider.prototype = {
		_init : function(options) {
			// options
			this.options = $.extend(true, {}, $.StackSlider.defaults, options);
			// support css transitions and 3d transforms
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d;
			var transEndEventNames = {
					'WebkitTransition' : 'webkitTransitionEnd',
					'MozTransition' : 'transitionend',
					'OTransition' : 'oTransitionEnd',
					'msTransition' : 'MSTransitionEnd',
					'transition' : 'transitionend'
				},
				transformNames = {
					'WebkitTransform' : '-webkit-transform',
					'MozTransform' : '-moz-transform',
					'OTransform' : '-o-transform',
					'msTransform' : '-ms-transform',
					'transform' : 'transform'
				};
			if (this.support) {
				this.transEndEventName = transEndEventNames[Modernizr.prefixed('transition')] + '.stackslider';
				this.transformName = transformNames[Modernizr.prefixed('transform')];
			}
			this.current 	= 0;
			var self 		= this;
			self._layout();
			if (self.itemsCount === 0) {
				return false;
			}
			self._initEvents();
		},
		_layout : function() {
			// items
			var $items = this.$stack.children('li');
			// total items
			this.itemsCount = $items.length;
			// main wrapper
			this.$wrapper = $('<div class="st-wrapper"></div>');
			// add 2 piles
			if (this.options.piles) {
				this.$lPile = $('<div class="st-stack st-stack-left"></div>');
				this.$rPile = $('<div class="st-stack st-stack-right"></div>');
				this.$wrapper.append(this.$lPile, this.$rPile);
			}
			// add title
			this.$title = $('<div class="st-title"></div>').appendTo(this.$wrapper);
			// add navigation
			if (this.itemsCount > 1) {
				this.$navigation = $('<nav><span class="st-first">First</span><span class="st-prev">Previous</span><span class="st-next">Next</span><span class="st-last">Last</span></nav>');
				this.$wrapper.append(this.$navigation);
			}
			var html = '';
			$items.each(function() {
				var $this = $( this );
				html += '<div class="st-item" data-title="' + $this.children( 'div.st-title' ).html() + '">' + $this.children( 'div.st-item' ).html() + '</div>';
			});
			this.$listitems = $('<div class="st-item-list"></div>').html(html);
			this.$items = this.$listitems.children( 'div' ).hide();
			this.$wrapper.insertAfter(this.$stack).prepend(this.$listitems);
			this.$stack.remove();
			if (this.options.piles) {			
				this.$rPile.css( 'height', '+=' + (this.itemsCount - 1) * 5);
			}
			this._setSize();
			this._initItems();
		},
		_setSize : function() {
			// todo: factor should depend on the perspective value. The lower the perpsective value, the higher the width..
			var itemH = this.$items.height(),
				pileW = 1.25 * itemH;
			// distance between one pile's center point to the center of the wrapper
			this.radius = this.$wrapper.width() / 2 - pileW / 2;
			if (this.options.piles) {
				//this.$lPile.css('width', pileW);
				//this.$rPile.css('width', pileW);
				this.$lPile.css('width', '30%');
				this.$rPile.css('width', '30%');
			}
		},
		_initEvents : function( position ) {
			var self = this;
			this.$navigation.children('span.st-next').on({
				'mousedown.stackslider' : function() {
					self._navigate( 'next' );
					self.startflowtimeout = setTimeout( function() {
						self.flow = true;
						self._flow('next');
					}, 600);
					//self._mouseup('next');
				}, 
				'mouseup.stackslider mouseleave.stackslider' : function() {
					self._mouseup('next');
				}
			}).end().children('span.st-prev').on({
				'mousedown.stackslider' : function() {
					self._navigate('prev');
					self.startflowtimeout = setTimeout( function() {
						self.flow = true;
						self._flow('prev');
					}, 600);
					//self._mouseup('prev');
				},
				'mouseup.stackslider mouseleave.stackslider' : function() {
					self._mouseup('prev');
				}
			}).end().children('span.st-first').on({
				'mousedown.stackslider' : function() {
					self._navigate('first');
					self.startflowtimeout = setTimeout( function() {
						self.flow = true;
						self._flow('first');
					}, 600);
					self._mouseup('first');
				}
			}).end().children('span.st-last').on({
				'mousedown.stackslider' : function() {
					self._navigate('last');
					self.startflowtimeout = setTimeout( function() {
						self.flow = true;
						self._flow('last');
					}, 600);
					self._mouseup('last');
				}
			});
			$window.on('debouncedresize.stackslider', function() {
				self._setSize();
				self._initItems();
			});
		},
		_mouseup : function( dir ) {
			var self = this;
			clearTimeout(this.startflowtimeout);
			clearTimeout(this.flowtimeout);
			if (this.flow) {
				setTimeout(function() {
					if (self.current !== 0 && self.current !== self.itemsCount - 1 ) {
						self._navigate(dir);
					}
				}, 100);
				this.flow = false;
			}
		},
		_flow : function( dir ) {
			var self = this;
			this._navigate( dir, true );
			this.flowtimeout = setTimeout( function() { 
				self._flow( dir );
			}, 150 );
		},
		_navigate : function(dir, flow) {
			var self = this,
				classes = 'st-left st-center st-right st-leftflow st-rightflow', dirclass, posclass, pileOut, pileIn, pileType,
				$currentItem = this.$items.eq(this.current);
			var $wrapperItem 	= this.$wrapper;
			var $leftStack 		= this.$lPile;
			var $rightStack 	= this.$rPile;
			var $maxPileHeight 	= $leftStack.height() + $rightStack.height();
			var $autoHeight		= this.options.autoheight;
			var $imageCount		= this.itemsCount;
			if (dir === 'next' && this.current < this.itemsCount - 1) {
				++this.current;
				posclass 		= 'st-left';
				dirclass 		= flow ? 'st-leftflow' : posclass;
				pileOut 		= 'right';
				pileIn 			= 'left';
				pileType		= 'normal';
			} else if (dir === 'prev' && this.current > 0) {
				--this.current;
				posclass 		= 'st-right';
				dirclass 		= flow ? 'st-rightflow' : posclass;
				pileOut 		= 'left';
				pileIn 			= 'right';
				pileType		= 'normal';
			} else if (dir === 'first' && this.current > 0) {
				this.current 	= 0;
				posclass 		= 'st-right';
				dirclass 		= flow ? 'st-rightflow' : posclass;
				pileOut 		= 'left';
				pileIn 			= 'right';
				pileType		= 'circle';
			} else if (dir === 'last' && this.current < this.itemsCount - 1) {
				this.current 	= this.itemsCount - 1;
				posclass 		= 'st-left';
				dirclass 		= flow ? 'st-leftflow' : posclass;
				pileOut 		= 'right';
				pileIn 			= 'left';
				pileType		= 'circle';
			} else {
				return false;
			}
			this._updatePile(pileOut, 'out', pileType, $imageCount);
			var $nextItem = this.$items.eq(this.current);
			$currentItem.removeClass(classes).addClass(dirclass);
			if (this.support) {
				$currentItem.on(this.transEndEventName , function() {
					$(this).removeClass(classes).addClass(posclass).off(self.transEndEventName);
					self._updatePile(pileIn, 'in', pileType, $imageCount);
				});
			} else {
				$currentItem.removeClass(classes).addClass(posclass);
				this._updatePile(pileIn, 'in', pileType, $imageCount);
			}
			$nextItem.show();
			setTimeout(function() {
				if ((flow && (self.current === 0 || self.current === self.itemsCount - 1)) || !flow) {
					$nextItem.removeClass(classes).addClass('st-center');
					if ($autoHeight) {
						$wrapperItem.height($nextItem.find('img').height() + $maxPileHeight + 25);
					}
				}
			}, 25 );
			clearTimeout(this.titletimeout);
			var time = this.support ? this.options.speed : 0;
			this.titletimeout = setTimeout( function() {
				self.$title.html( $nextItem.data('title'));
			}, time );
		},
		_updatePile : function(pile, action, type, count) {
			if (!this.options.piles) {
				return false;
			}
			//alert(pile + ' / ' + action + ' / ' + type + ' / ' + count);
			if ((pile === 'right') && (type === 'normal')) {
				this.$rPile.css('height', action === 'in' ? '+=5' : '-=5');
			} else if ((pile === 'left') && (type === 'normal')) {
				this.$lPile.css('height', action === 'in' ? '+=5' : '-=5');
			} else if ((pile === 'left') && (type === 'circle')) {
				this.$lPile.css('height', action === 'in' ? (count * 5 - 5) : '5');
			} else if ((pile === 'right') && (type === 'circle')) {
				this.$rPile.css('height', action === 'in' ? (count * 5 - 5) : '5');
			}
		},
		_initItems : function() {
			var self = this,
				wrapperW = this.$wrapper.width(), wrapperH = this.$wrapper.height(),
				$currentItem = this.$items.eq( this.current ).addClass( 'st-center' ).show(),
				pileHFactor = this.options.piles ? Math.max( this.$lPile.height(), this.$rPile.height() ) / 2 : 0,
				$maxPileHeight 	= this.$lPile.height() + this.$rPile.height(),
				$maxImageHeight = 0;
			this.$title.html( $currentItem.data('title'));
			this.$items.each( function( i ) {
				var $item = $(this),
					itemH = $item.find('img').height(), itemW = $item.width(),
					itemTop = wrapperH - self.radius - itemH / 2;
				if ($item.index() !== self.current) {
					$item.addClass('st-right');
				}
				$item.find('img').attr("data-stack", (wrapperW / $item.find('img').attr("data-ratio")));
				if ((wrapperW / $item.find('img').attr("data-ratio")) > $maxImageHeight) {
					$maxImageHeight = (wrapperW / $item.find('img').attr("data-ratio"));
				}
				if (self.support) {
					$item.css( {
						transition : self.transformName + ' ' + self.options.speed + 'ms ' + self.options.easing + ', opacity ' + self.options.speed + 'ms ' + self.options.easing,
						transformOrigin : '50% ' + ( self.radius + itemH / 2 - pileHFactor ) + 'px'
					});					
				}
				$item.css( {
					left : wrapperW / 2 - itemW / 2,
					top : 0, //itemTop
				});
			});
			if (this.options.autoheight) {
				this.$wrapper.height($currentItem.find('img').height() + $maxPileHeight + 25);
			} else {
				this.$wrapper.height($maxImageHeight + $maxPileHeight + 25);
			}
		}
	};
	var logError = function( message ) {
		if (window.console) {
			window.console.error(message);		
		}
	};
	$.fn.stackslider = function(options) {
		var instance = $.data( this, 'stackslider' );		
		if ( typeof options === 'string' ) {			
			var args = Array.prototype.slice.call( arguments, 1 );			
			this.each(function() {			
				if ( !instance ) {
					logError( "cannot call methods on stackslider prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;				
				}				
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for stackslider instance" );
					return;
				}
				instance[ options ].apply( instance, args );
			});
		} 
		else {
			this.each(function() {
				if ( instance ) {
					instance._init();
				}
				else {
					instance = $.data( this, 'stackslider', new $.StackSlider( options, this ) );
				}
			});
		}		
		return instance;
	};
} )( jQuery, window );