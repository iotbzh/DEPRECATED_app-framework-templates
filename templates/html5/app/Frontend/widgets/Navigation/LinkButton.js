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
 */

(function () {
    'use strict';

    var tmpl = '<span title="Goto: {{href}}" ng-click="clicked()">' +
            '<i class="{{icon}}"></i>' +
            '<span>{{label}}</span>' +
            '</span>';


    angular.module('LinkButton', [])
            .directive('linkButton', function ($location) {
                
                function mymethods(scope, elem, attrs) {

                    scope.clicked = function () {
                        
                        if (!attrs.query) $location.path(attrs.href);
                        else $location.path(attrs.href).search(attrs.query);
                    };

                    // ajust icon or use default
                    scope.icon = attrs.icon   || 'fi-link';
                    scope.label = attrs.label || 'Jump';
                    scope.href  = attrs.href  || '/home';
                    
                    // add label as class
                    elem.addClass (scope.label.toLowerCase());
                }

                return {
                    restrict: 'E',
                    template: tmpl,
                    link: mymethods,
                    scope: {}
                };
            });
})();
