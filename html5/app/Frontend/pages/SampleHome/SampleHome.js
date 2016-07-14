(function() {
'use strict';

// WARNING: make sure than app/frontend/services/AppConfig.js match your server

// list all rependencies within the page + controler if needed
angular.module('SampleHomeModule', ['SamplePostModule', 'SubmitButton', 'TokenRefresh','ModalNotification'])

  .controller('SampleHomeController', function (AppCall, Notification) {
        var scope = this; // I hate JavaScript
        scope.uuid   ="none";
        scope.token  ="none";
        scope.session="none";
        scope.status ="err-no";

        console.log ("Home Controller");
        
        scope.OnResponse= function(jresp, errcode) {
            
            // Update UI response global display zone
            scope.status   = jresp.request.status;
            scope.errcode  = errcode;
            scope.request  = jresp.request;
            scope.response = jresp.response;
            
            var action=jresp.request.reqid.toUpperCase();
                        
            switch (action) {
                case 'CONNECT':
                    if (jresp.request.status !== "success") {
                        Notification.error ({message: action + ": Logout before reconnecting", delay: 5000});
                        scope.class [jresp.request.reqid]="fail";   
                        return;
                    }                    
                    scope.class={}; // reset CSS buttons classes
                    break;
                    
                case 'LOGOUT':
                    if (jresp.request.status !== "success") {
                        Notification.error ({message: action + ": Do connect first", delay: 5000});
                        scope.class [jresp.request.reqid]="fail";   
                        return;
                    }
                    scope.class={}; // reset CSS buttons classes
                    break;
                    
                case 'REFRESH':
                case 'CHECK':
                    if (jresp.request.status !== "success") {
                        Notification.error ({message: action + ": Need to be Connected to check/refresh session", delay: 5000});
                        scope.class [jresp.request.reqid]="fail";   
                        return;
                    }
                    
                    break;
                    
                default:
                    Notification.error ({message: "Invalid RequestID:" + jresp.request.reqid , delay: 5000});
                    return;
            } 

            // update button classes within home.html
            scope.class [jresp.request.reqid]="success";            
            console.log ("OK: "+ JSON.stringify(jresp));
        };
        
        scope.ProcessError= function(response, errcode, config) {
            Notification.error ({message: "Invalid API:" + response.request.reqid , delay: 5000});
            scope.status   = "err-fx";
            scope.errcode  = errcode;
            scope.request  = response.request;
            scope.response = "";            
            console.log ("FX: "+ JSON.stringify(response));
        };

        scope.ConnectClient = function() {
            console.log ("ConnectClient");
            AppCall.get ("auth", "connect", {/*query*/}, scope.OnResponse, scope.InvalidApiCall);
        };        

        scope.CheckSession = function() {
            console.log ("CheckSession");
            AppCall.get ("auth", "check", {/*query*/}, scope.OnResponse, scope.InvalidApiCall);
           
        };
        
        scope.RefreshSession = function() {
            console.log ("RefreshSession");
            AppCall.get ("auth", "refresh", {/*query*/}, scope.OnResponse, scope.InvalidApiCall);
        };
        
        scope.LogoutClient = function() {
            console.log ("LogoutClient");
            AppCall.get ("auth", "logout", {/*query*/}, scope.OnResponse, scope.InvalidApiCall);
        };
        
        scope.Initialised = function () {
            scope.class = {connect: "success"};
        };
        
   });

console.log ("SampleControler Loaded");
})(); 