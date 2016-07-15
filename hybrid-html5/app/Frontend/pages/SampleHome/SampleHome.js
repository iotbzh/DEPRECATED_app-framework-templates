(function() {
'use strict';

// WARNING: make sure than app/frontend/services/AppConfig.js match your server

// list all rependencies within the page + controler if needed
angular.module('SampleHomeModule', ['SubmitButton', 'TokenRefresh','ModalNotification'])

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
                case 'PING':
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

        scope.RefreshSession = function() {
            console.log ("RefreshSession");
            AppCall.get ("xxxxxx", "ping", {/*query*/}, scope.OnResponse, scope.InvalidApiCall);
        };
        
        scope.Initialised = function () {
            scope.class = {connect: "success"};
        };
        
   });

console.log ("SampleControler Loaded");
})(); 
