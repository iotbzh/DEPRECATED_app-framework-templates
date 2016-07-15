/* 
 * Copyright (C) 2015 "IoT.bzh"
 * Author "Fulup Ar Foll"
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * Bugs: Input with Callback SHOULD BE get 'required' class
 * 
 * ref: https://developer.mozilla.org/en-US/docs/Web/Events/mouseover
 * 
 * usage: 
Usage  <range-slider>
---------------------
   <range-slider
      id="my-slider-name"                     // only use as an argument to callback
      class="my-custom-class"                 // default class is ibz-range-slider
      placeholder="Track Date Selection"      // place holder for date readonly input zone

      <!-- Foundation classes -->
      class="radius"                          // check Zurb foundation doc for further info.
      class="ibz-handle-display"              // increase handle width to hold slider current value

      <!-- Angular Scope Variables -->
      callback="myCallBack"                    // $scope.myCallBack(sliderhandle) is called when ever slider handle blur
      formatter="SliderFormatCB"               // $scope.myFormatter(value, sliderid) when exist is call when ever slider handle moves. Should return external form of slider value.
      ng-model="xxxxxx"                        // xxx Must be defined, script will store a new RangerObject within provided ng-model variable.
      start-at="ScopeVar"                      // Dynamic limitation when slider is constrains by an external componant [ex: check in/out]
      stop-at="ScopeVar"                       // Idem but for end.

      <!-- Angular Directive Attributes -->
      not-less="integer"                       // Fixed starting value for slider [default 0]
      not-more="integer"                       // Fixed end value for sliders [default 100]
      by-step="+-integer"                      // If by-step is >0 then slider use it as step-value, when negative use it for decimal precision
      display-target="handle"                  // display slider external formated value in the handle [requirer calss="ibz-handle-display"]
      dual-handles='true'                      // add a second handle to slider for min/max range
      initial='value|[start/stop]'             // slider initial value [dual-handles] may have initial values
   /></range-slider>
 */

(function () {
    'use strict';

var RangeSlider = angular.module('RangeSlider',[]);

function RangeSliderHandle (scope) {
    var internals = [];
    var externals = [];

    this.getId = function() {
        return scope.sliderid;
    };

    this.getCbHandle = function() {
        return scope.cbhandle;
    };

    this.getView= function (handle) {
        if (!handle) handle = 0;

        // if value did not change return current external representation
        if (scope.value[handle] === internals[handle]) return externals[handle];

        // build external representation and save it for further requests
        internals[handle] = scope.value[handle];
        if (scope.formatter) externals[handle] = scope.formatter(scope.value[handle], scope.ctrlhandle);
        else  externals[handle] = scope.value[handle];

        return externals[handle];
    };

    this.updateClass = function (classe, status) {
       scope.updateClass (classe, status);
    };

    this.forceRefresh = function (timer) {
       scope.forceRefresh(timer);
    };

    this.getValue= function (handle) {
        if (!handle) handle = 0;
        return scope.value[handle];
    };

    this.getRelative= function (handle) {
        if (!handle) handle = 0;
        return scope.relative[handle];
    };

    this.setValue= function (value, handle) {
        if (!handle) handle = 0;
        scope.setValue (value, handle);
    };

    this.setDisable= function (flag) {
        scope.setDisable(flag);
    };
}

RangeSlider.directive('rangeSlider', function ($log, $document, $timeout) {

    var template= '<div class="ibz-range-slider range-slider" title="{{title}}"data-slider>'+
                  '<span class="range-slider-handle handle-min" ng-mousedown="handleCB($event,0)" ng-focus="focusCB(true)" ng-blur="focusCB(false)" role="slider" tabindex="0"></span>'+
                  '<span class="handle-max" ng-mousedown="handleCB($event,1)" ng-focus="focusCB(true)" ng-blur="focusCB(false)" role="slider" tabindex="0"></span>'+
                  '<span class="range-slider-active-segment"></span>'+
                  '<span class="ibz-range-slider-start" ></span> '+
                  '<span class="ibz-range-slider-stop"></span> '+
                  '<input id={{sliderid}} type="hidden">'+
                  '</div>';


    function link (scope, element, attrs, model) {
        // full initialisation of slider from a single object
        scope.initWidget = function (initvalues) {

            if (initvalues.byStep)  scope.byStep  = parseInt(initvalues.byStep);
            if (initvalues.notMore) scope.notMore = parseInt(initvalues.notMore);
            if (initvalues.notLess) scope.notLess = parseInt(initvalues.notLess);
            if (initvalues.id)      scope.sliderid= initvalues.id;

            // hugely but in some case DOM is not finish when we try to set values !!!
            if (initvalues.value !== undefined)   {
                scope.value = initvalues.value;
                scope.forceRefresh (50); // wait 50ms for DOM to be ready
            }
        };

        // this function recompute slide positioning
        scope.forceRefresh = function (timer) {
           var value = scope.value;
           scope.value = [undefined,undefined];
           $timeout (function() {
               scope.setValue(value[0],0);
               if (scope.dual)  scope.setValue(value[1],1);
           }, timer);
        };

        // handler to change class from slider handle
        scope.updateClass = function (classe, status) {

            if (status) element.addClass (classe);
            else  element.removeClass (classe);
        };

        scope.setDisable = function (disabled) {

            if (disabled) {
                element.addClass ("disable");
                scope.handles[0].css ('visibility','hidden');
                if (scope.dual) {
                    scope.handles[1].css ('visibility','hidden');
                }
            } else {
                element.removeClass ("disable");
                scope.handles[0].css ('visibility','visible');
                if (scope.dual) scope.handles[1].css ('visibility','visible');
            }

        };

        scope.normalize = function (value) {
            var result;
            var range = scope.notMore - scope.notLess;
            var point = value * range;

            // if step is positive let's round step by step
            if (scope.byStep >  0) {
                var mod = (point - (point % scope.byStep)) / scope.byStep;
                var rem = point % scope.byStep;

                var round = (rem >= scope.byStep * 0.5 ? scope.byStep : 0);
                result= (mod * scope.byStep + round) + scope.notLess;
                //console.log ("range=%d value=%d point=%d mod=%d rem=%d round=%d result=%d", range, value, point, mod, rem, round, result)
                return result;
            }

            // if step is negative return round to asked decimal
            if (scope.byStep <  0) {
                var power  =  Math.pow (10,(scope.byStep * -1));
                result = scope.notLess + parseInt (point * power) / power;
                return (result);
            }

            // if step is null return full value
            return point;
       };

        // return current value
        scope.getValue = function (offset, handle) {
            if (scope.vertical) {
                scope.relative[handle] = (offset - scope.bounds.handles[handle].getBoundingClientRect().height) / (scope.bounds.bar.getBoundingClientRect().height - scope.bounds.handles[handle].getBoundingClientRect().height);
            } else {
                scope.relative[handle] = offset /  (scope.bounds.bar.getBoundingClientRect().width - scope.bounds.handles[handle].getBoundingClientRect().width);
            }

            var newvalue = scope.normalize (scope.relative[handle]);


            // if internal value change update or model
            if (newvalue !== scope.value[handle]) {
                if (newvalue < scope.startValue) newvalue=scope.startValue;
                if (newvalue > scope.stopValue)  newvalue=scope.stopValue;


                if (scope.formatter) {
                    scope.viewValue = scope.formatter (newvalue, scope.ctrlhandle);
                } else {
                    scope.viewValue = newvalue;
                }
                if (scope.displays[handle]) {
                    scope.displays[handle].html (scope.viewValue);
                }

                // update external representation of the model
                scope.value[handle] = newvalue;
                if (model) model.$setViewValue (scope.viewValue);
                scope.$apply();
                if (newvalue > scope.startValue && newvalue < scope.stopValue) scope.translate(offset, handle);
            }
        };


        scope.setStart = function (value) {
            var offset;
            
            if (value > scope.value[0]) {
                if (!scope.dual) scope.setValue (value,0);
                else scope.setValue (value,1);
            }

            if (scope.vertical) {
                offset = scope.bounds.bar.getBoundingClientRect().height * (value - scope.notLess) / (scope.notMore - scope.notLess);
                scope.start.css('height',offset + 'px');
            } else {
                offset = scope.bounds.bar.getBoundingClientRect().width * (value - scope.notLess) / (scope.notMore - scope.notLess);
                scope.start.css('width',offset + 'px');
            }

            scope.startValue= value;
        };

        scope.setStop = function (value) {
            var offset;
            
            if (value < scope.value[0]) {
                if (!scope.dual) scope.setValue (value,0);
                else scope.setValue (value,1);
            }

            if (scope.vertical) {
                offset = scope.bounds.bar.getBoundingClientRect().height * (value - scope.notLess) / (scope.notMore - scope.notLess);
                scope.start.css('height',offset + 'px');
            } else {
                offset = scope.bounds.bar.getBoundingClientRect().width * (value - scope.notLess) / (scope.notMore - scope.notLess);
                scope.stop.css({'right': 0, 'width': (scope.bounds.bar.getBoundingClientRect().width  - offset) + 'px'});
            }

            scope.stopValue= value;
        };

        scope.translate = function (offset, handle) {
            var start;
            
            if (scope.vertical) {
                // take handle size in account to compute middle
                var voffset = scope.bounds.bar.getBoundingClientRect().height - offset;

                scope.handles[handle].css({
                    '-webkit-transform': 'translateY(' + voffset + 'px)',
                    '-moz-transform': 'translateY(' + voffset + 'px)',
                    '-ms-transform': 'translateY(' + voffset + 'px)',
                    '-o-transform': 'translateY(' + voffset + 'px)',
                    'transform': 'translateY(' + voffset + 'px)'
               });
               if (!scope.dual) scope.slider.css('height', offset + 'px');
               else if (scope.relative[1] && scope.relative[0]) {
                   var height = (scope.relative[1] - scope.relative[0]) *  scope.bounds.bar.getBoundingClientRect().height;
                   start  = (scope.relative[0] *  scope.bounds.bar.getBoundingClientRect().height);
                   scope.slider.css ({'bottom': start+'px','height': height + 'px'});
               }
            } else {

                scope.handles[handle].css({
                    '-webkit-transform': 'translateX(' + offset + 'px)',
                    '-moz-transform': 'translateX(' + offset + 'px)',
                    '-ms-transform': 'translateX(' + offset + 'px)',
                    '-o-transform': 'translateX(' + offset + 'px)',
                    'transform': 'translateX(' + offset + 'px)'
                });
                if (!scope.dual) scope.slider.css('width',offset + 'px');
                else if (scope.relative[1] && scope.relative[0]) {
                    var width = (scope.relative[1] - scope.relative[0]) *  scope.bounds.bar.getBoundingClientRect().width;
                    start = (scope.relative[0] *  scope.bounds.bar.getBoundingClientRect().width);
                    scope.slider.css ({'left': start+'px','width': width + 'px'});
                }
            }
        };

        // position handle on the bar depending a given value
        scope.setValue = function (value , handle) {
            var offset;

            // if value did not change ignore
            if (value === scope.value[handle]) return;
            if (value === undefined)   value=0;
            if (value > scope.notMore) value=scope.notMore;
            if (value < scope.notLess) value=scope.notLess;

            if (scope.vertical) {
                scope.relative[handle] = (value - scope.notLess) / (scope.notMore - scope.notLess);
                if (handle === 0) offset = (scope.relative[handle] * scope.bounds.bar.getBoundingClientRect().height) + scope.bounds.handles[handle].getBoundingClientRect().height/2;
                if (handle === 1) offset = scope.relative[handle] * scope.bounds.bar.getBoundingClientRect().height;

            } else {
                scope.relative[handle] = (value - scope.notLess) / (scope.notMore - scope.notLess);
                offset = scope.relative[handle] *  (scope.bounds.bar.getBoundingClientRect().width - scope.bounds.handles[handle].getBoundingClientRect().width);
            }

            scope.translate (offset,handle);
            scope.value[handle] = value;

            if (scope.formatter) {
                // when call through setValue we do not pass cbHandle
                scope.viewValue = scope.formatter (value, undefined);
            } else {
                scope.viewValue = value;
            }

            if (model) model.$setViewValue( scope.viewValue);

            if (scope.displays[handle]) {
                scope.displays[handle].html (scope.viewValue);
            }
        };


        // Minimal keystroke handling to close picker with ESC [scope.actif is current handle index]
        scope.keydown=  function(e){

            switch(e.keyCode){
                case 39: // Right
                case 38: // up
                     if (scope.byStep > 0) scope.$apply(scope.setValue ((scope.value[scope.actif]+scope.byStep), scope.actif));
                     if (scope.byStep < 0) scope.$apply(scope.setValue ((scope.value[scope.actif]+(1 / Math.pow(10, scope.byStep*-1))),scope.actif));
                     if (scope.callback)  scope.callback (scope.value[scope.actif], scope.ctrlhandle);
                     break;
                case 37: // left
                case 40: // down
                    if (scope.byStep > 0) scope.$apply(scope.setValue ((scope.value[scope.actif] - scope.byStep), scope.actif));
                    if (scope.byStep < 0) scope.$apply(scope.setValue ((scope.value[scope.actif] - (1 / Math.pow(10, scope.byStep*-1))),scope.actif));
                    if (scope.callback)  scope.callback (scope.value[scope.actif], scope.ctrlhandle);
                    break;
                case 27: // esc
                    scope.handles[scope.actif][0].blur();
            }
        };

        scope.moveHandle = function (handle, clientX, clientY) {
            var offset;
            if (scope.vertical) {
                offset = scope.bounds.bar.getBoundingClientRect().bottom - clientY;
                if (offset > scope.bounds.bar.getBoundingClientRect().height) offset = scope.bounds.bar.getBoundingClientRect().height;
                if (offset < scope.bounds.handles[handle].getBoundingClientRect().height) offset = scope.bounds.handles[handle].getBoundingClientRect().height;
            } else {
                offset = clientX - scope.bounds.bar.getBoundingClientRect().left;

                if (offset < 0) offset = 0;
                if ((clientX + scope.bounds.handles[handle].getBoundingClientRect().width) > scope.bounds.bar.getBoundingClientRect().right) {
                    offset = scope.bounds.bar.getBoundingClientRect().width - scope.bounds.handles[handle].getBoundingClientRect().width;
                }
            }

            scope.getValue  (offset, handle);

            // prevent dual handle to cross
            if (scope.dual && scope.value [0] > scope.value[1]) {
                if (handle === 0) scope.setValue (scope.value[0] , 1);
                else scope.setValue(scope.value[1],0);
            }
        };


        scope.focusCB = function (inside) {
            if (inside) {
                $document.on('keydown',scope.keydown);
            } else {
                $document.unbind('keydown',scope.keydown);
            }
        };

        // bar was touch let move handle to this point
        scope.touchBarCB = function (event) {
            var handle=0;
            var relative;
            var touches = event.changedTouches;
            var oldvalue = scope.value[handle];

            event.preventDefault();

            // if we have two handles select closest one from touch point
            if (scope.dual) {
                if (scope.vertical) relative = (touches[0].pageY - scope.bounds.bar.getBoundingClientRect().bottom) / scope.bounds.bar.getBoundingClientRect().height;
                else relative= (touches[0].pageX - scope.bounds.bar.getBoundingClientRect().left) / scope.bounds.bar.getBoundingClientRect().width;

                var distance0 = Math.abs(relative - scope.relative[0]);
                var distance1 = Math.abs(relative - scope.relative[1]);
                if (distance1 < distance0) handle=1;
            }

            // move handle to new place
            scope.moveHandle (handle,touches[0].pageX, touches[0].pageY);
            if (scope.callback && oldvalue !== scope.value[handle]) scope.callback (scope.value[handle], scope.ctrlhandle);
        };

        // handle was touch and drag
        scope.touchHandleCB = function (touchevt, handle) {
            var oldvalue = scope.value[handle];

            touchevt.preventDefault();
            $document.on('touchmove',touchmove);
            $document.on('touchend' ,touchend);
            element.unbind('touchstart', scope.touchBarCB);

            function touchmove(event) {
                event.preventDefault();
                var touches = event.changedTouches;
                for (var idx = 0; idx < touches.length; idx++) {
                    scope.moveHandle (handle,touches[idx].pageX, touches[idx].pageY);
                }
            }

            function touchend(event) {
               $document.unbind('touchmove',touchmove);
               $document.unbind('touchend' ,touchend);
               element.on('touchstart', scope.touchBarCB);

                // if value change notify application callback
                if (scope.callback && oldvalue !== scope.value[handle]) scope.callback (scope.value[handle], scope.ctrlhandle);
            }
        };

        scope.handleCB = function (clickevent, handle) {

            if (attrs.automatic) return;
            
            var oldvalue = scope.value[handle];
            // register mouse event to track handle
            clickevent.preventDefault();

            $document.on('mousemove',mousemove);
            $document.on('mouseup', mouseup);
            scope.handles[handle][0].focus();
            scope.actif=handle;

            // slider handle is moving
            function mousemove(event) {
                scope.moveHandle (handle, event.clientX, event.clientY);
            }

            // mouse is up dans leave slider send resize events
            function mouseup() {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);

                // if value change notify application callback
                if (scope.callback && oldvalue !== scope.value[handle]) scope.callback (scope.value[handle], scope.ctrlhandle);
            }
        };

        // simulate jquery find by classes capabilities [warning only return 1st elements]
        scope.find = function (select, elem) {
            var domelem;

            if (elem) domelem = elem[0].querySelector(select);
            else domelem = element[0].querySelector(select);

            var angelem = angular.element(domelem);
            return (angelem);
        };



        scope.initialSettings = function (initial) {
            var decimal_places_match_result;
            scope.value=[];  // store low/height value when two handles
            scope.relative=[];

            if (scope.precision === null) {
                decimal_places_match_result = ('' + scope.byStep).match(/\.([\d]*)/);
                scope.precision = decimal_places_match_result && decimal_places_match_result[1] ? decimal_places_match_result[1].length : 0;
            }

            // position handle to initial value(s)
            element.on('touchstart', scope.touchBarCB);
            scope.handles[0].on('touchstart', function(evt){scope.touchHandleCB(evt,0);});

            // this slider has two handles low/hight
            if (scope.dual) {
                scope.handles[1].addClass('range-slider-handle');
                scope.handles[1].on('touchstart', function(evt){scope.touchHandleCB(evt,1);});
                if (!scope.initvalues) scope.setValue (initial[1],1);
            }

            // if we have an initstate object apply it
            if (scope.initvalues) scope.initWidget (scope.initvalues);
            else   scope.setValue (initial[0],0);
        };

        scope.init = function () {
            scope.sliderid   = attrs.id || "slider-" + parseInt (Math.random() * 1000);
            scope.startValue = -Infinity;
            scope.stopValue  = Infinity;
            scope.byStep   = parseInt(attrs.byStep) || 1;
            scope.vertical = attrs.vertical   || false;
            scope.dual     = attrs.dualHandles|| false;
            scope.trigger_input_change= false;
            scope.notMore  = parseInt(attrs.notMore)   || 100;
            scope.notLess  = parseInt(attrs.notLess)   || 0;

            if (scope.vertical) element.addClass("vertical-range");

            scope.handles= [scope.find('.handle-min'), scope.find('.handle-max')];
            scope.bar    = element;
            scope.slider = scope.find('.range-slider-active-segment');
            scope.start  = scope.find('.ibz-range-slider-start');
            scope.stop   = scope.find('.ibz-range-slider-stop');
            scope.disable= attrs.disable || false;

            scope.ctrlhandle = new RangeSliderHandle (scope);

            // prepare DOM object pointer to compute size dynamically
            scope.bounds = {
                bar    : element[0],
                handles: [scope.handles[0][0], scope.handles[1][0]]
            };

            if (attrs.disable === 'true') scope.setDisable(true);

            if (attrs.displayTarget) {
                switch (attrs.displayTarget) {
                    case true :
                    case 'handle' :
                        scope.displays = scope.handles;
                        scope.handles[0].addClass('ibz-range-slider-display');
                        if (scope.dual) scope.handles[1].addClass('ibz-range-slider-display');
                        break;
                    default:
                        scope.displays =  [$document.getElementById (attrs.displayTarget)];
                }
            } else scope.displays=[];

            // extract initial values from attrs and parse into int
            if (!attrs.initial) {
                scope.initial  = [scope.ngModel, scope.ngModel]; // initialize to model values
            } else {
                var initial  = attrs.initial.split(',');
                scope.initial = [
                    initial[0] !== undefined ? parseInt (initial[0]) : scope.notLess,
                    initial[1] !== undefined ? parseInt (initial[1]) : scope.notMore
                ];
            }

            // Monitor any changes on start/stop dates.
            scope.$watch('startAt', function() {
                if (scope.value < scope.startAt ) {
                    //scope.setValue (scope.startAt);
                }
                if (scope.startAt) scope.setStart (scope.startAt);
            });

            scope.$watch('stopAt' , function() {
                if (scope.value > scope.stopAt) {
                    //scope.setValue (scope.stopAt);
                }
                if (scope.stopAt) scope.setStop (scope.stopAt);
            });

            // finish widget initialisation
            scope.initialSettings (scope.initial);

        };

        scope.init();
        
         // slider is ready provide control handle to application controller
        scope.$watch ('inithook', function () {         // init Values may arrive late
            if (scope.inithook) scope.inithook (scope.ctrlhandle);
        });

        scope.$watch ('initvalues', function () { 	// init Values may arrive late
            if (scope.initvalues) scope.initWidget(scope.initvalues);
        });

        // two-way binding if model value changes
        scope.$watch ('ngModel', function (newValue) {
          scope.setValue(newValue, 0);
        });
    }

return {
    restrict: "E",    // restrict to <range-slider> HTML element name
    scope: {
        startAt  :'=',  // First acceptable date
        stopAt   :'=',  // Last acceptable date
        callback :'=',  // Callback to actif when a date is selected
        formatter:'=',  // Callback for drag event call each time internal value changes
        inithook :'=',  // Hook point to control slider from API
        cbhandle :'=',  // Argument added to every callback
        initvalues:'=',   // Initial values as a single object
        ngModel: '='    // the model value
    },
    require: '?ngModel',
    template: template, // html template is build from JS
    replace: true,      // replace current directive with template while inheriting of class
    link: link          // pickadate object's methods
};
});

console.log ("RangeSlider Loaded");

})();