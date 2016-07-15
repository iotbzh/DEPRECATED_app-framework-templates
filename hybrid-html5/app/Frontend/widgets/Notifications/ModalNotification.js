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
 * 
 * tipModal: listen event from elem.parent() to display tip-modal
 *      <div class="xxxx">
 *          <tip-modal tip=xxxx></tip-modal>
 *          <input-text ....></input-text>
 *      </div>
 *      
 * Note: use CSS.visibility to avoid display flickering at initial display.
 */

(function () {
    'use strict';

    var tmpl = '<div class="tip-modal-popup">' +
            '<i class="{{icon}}"></i>' +
            '<span>{{tip}}</span>' +
            '</span></div>' ;

    angular.module('ModalNotification', [])
            .directive('tipModal', function ($timeout) {

                function mymethods(scope, elem, attrs) {
                    scope.parent = elem.parent();
                    scope.modal    = elem.find("div");
                    
    
                    // delay tip display to avoid blinking when moving mouse fast
                    function display () {
                        function action() {
                             if (scope.show) scope.modal.css({opacity: 1, visibility:'visible'});  
                        }
                        scope.show = true;
                        scope.timeout = $timeout(action, scope.delay);
                    }
                    
                    function close () {
                      scope.show = false;                     
                      scope.modal.css({opacity: 0, visibility:'hidden'});
                    }
                    

                    // ajust icon or use default
                    scope.icon  = attrs.icon || 'fi-lightbulb';
                    
                    // Update Parent element to get mouse event
                    scope.parent.addClass ('as-modal-tip');
                    scope.parent.bind('click', close);
                    scope.parent.bind('focus', display);
                    scope.parent.bind('mouseover', display);
                    scope.parent.bind('mouseleave', close);
                    scope.parent.bind('blur', close);
                    
                    scope.delay = attrs.delay || 1000; // wait 1s before displaying tip
                }

                return {
                    restrict: 'E',
                    template: tmpl,
                    link: mymethods,
                    scope: {tip: "="} // tip may not be defined when widget is display
                };
            });
})();
