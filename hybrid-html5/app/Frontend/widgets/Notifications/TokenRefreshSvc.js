/*
 alsa-gateway -- provide a REST/HTTP interface to ALSA-Mixer

 Copyright (C) 2015, Fulup Ar Foll

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with scope program; if not, write to the Free Software
 Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

 References:

 */

(function () {
    'use strict';

    var template =
          '<div class="afb-monitor" ng-click="getping()">' +
         '<span class="afb-refresh-token"  >afb://{{hostname}}:{{httpdport}}</span>' +
         '<i class="{{icon}}"></i>' +
         '</div>';


// scope module is load statically before any route is cativated
angular.module('TokenRefresh', ['AppConfig', 'ModalNotification'])

    .directive ('tokenRefresh', function($log, $window, $timeout, $location, Notification, AppConfig, AppCall) {

    function mymethods(scope, elem, attrs) {
        scope.logged=undefined; // neither thu neither false
        
        $window.onbeforeunload = function () {
            AppCall.get (scope.plugin, "logout", {/*query*/}, function () {    
            $log.log("OPA exit");            
            });
        };
                 
        scope.online = function () {
            elem.addClass    ("online");
            elem.removeClass ("offline");
            scope.logged=true;
        };

        scope.offline = function(){
            elem.addClass    ("offline");
            elem.removeClass ("online");
            scope.logged=false;
        };
        
        scope.onerror = function() {
            if (scope.logged !== false)  {
                Notification.warning ({message: "AppFramework Binder Lost", delay: 5000});
                scope.offline();
            }
            scope.status = 0;
        };
        
        scope.onsuccess = function(jresp, errcode) {
            
            if (errcode !== 200 || jresp.request.status !== "success") {
                Notification.warning ({message: "auto-connect :" + jresp.request.info, delay: 10000});
                scope.offline(); 
                return false;
            }
            
            if (scope.logged !== true)  {
                Notification.success ({message: "AppFramework Binder Connected", delay: 3000});
                scope.online();
                if (scope.callback) scope.callback(jresp);
            }
            
            scope.status = 1;            
            return true;
        };

        // Check Binder status
        scope.getping = function() {
            
            AppCall.get (scope.plugin, "ping", {/*query*/},function(jresp, errcode) {
                if (errcode !== 200 || jresp.request.status !== "success") {
                    Notification.warning ({message: jresp.request.info, delay: 5000});
                    scope.offline(); 
                    return;
                }
                // restart a new timer for next ping
                $timeout (scope.getping, AppConfig.session.pingrate*1000);
            }, scope.onerror);
        };
        
        // Check Binder status
        scope.refresh = function() {
            
            AppCall.get (scope.plugin, "refresh", {/*query*/}, function(jresp, errcode) {

                scope.onsuccess (jresp, errcode);
                
                // restart a new timer for next refresh
                $timeout (scope.refresh, AppConfig.session.timeout *250);
            }, scope.onerror);            
        };
        
        // Initial connection
        scope.loggin = function() {            
            AppCall.get (scope.plugin, "connect", {token: AppConfig.session.initial}, function(jresp, errcode) {
                
                if (!scope.onsuccess (jresp, errcode)) return;
                
                // Intial token was accepted let's start ping & refresh
                $timeout (scope.getping, AppConfig.session.pingrate*1000);
                $timeout (scope.refresh, AppConfig.session.timeout *250);
 
            }, scope.onerror);
        };


        // Parse Widget Parameters
        scope.plugin    = attrs.plugin || "auth";
        scope.icon      = attrs.icon   || "fi-lightbulb";
        scope.hostname  = $location.host();
        scope.httpdport = $location.port();
        scope.autolog   = JSON.parse(attrs.autolog || false);
        
        // autostart log if requested
        if (scope.autolog) scope.loggin();
        
    }

    return {
        template: template,
        scope: {
            callback : "="
        },
        restrict: 'E',
        link: mymethods
    };
});

})();
console.log ("Token Refresh Loaded");
