(function () {
    'use strict';

    // _all modules only reference dependencies
    angular.module('AppConfig', [])

            // Factory is a singleton and share its context within all instances.
            .factory('AppConfig', function (urlquery) {

                var myConfig = {
                    paths: { // Warning paths should end with /
                        image : 'images/',
                        avatar: 'images/avatars/'
                    },
                                        
                    session: { // Those data are updated by session service
                       initial : urlquery.token || '123456789',  // typical dev initial token
                       timeout : 3600,         // timeout is updated client sessin context creation
                       pingrate: 30,           // Ping rate to check if server is still alive
                       uuid    : '',           // uuid map with cookie or long term session access key
                       token   : ''            // will be returned from authentication    
                    }
                };

                return myConfig;
            })
            
            // Factory is a singleton and share its context within all instances.
            .factory('AppCall', function ($http, AppConfig, $log) {
                
                var myCalls = {
                    get : function(plugin, action, query, cbresponse, cberror) {                                                
                        
                        var onerror = function(response) {
                            if (cberror) cberror(response.data, response.status, response.config);
                            else cbresponse(response.data, response.status, response.config);
                        };
                        
                        var onsuccess =function(response) {
                            if (!response.data || !response.data.request) {
                                onerror (response);
                                return;
                            }                            
                        
                            var request=response.data.request;
                            
                            // if token was updated keep it within application cache
                            if (request.token) AppConfig.session.token = request.token;
                            if (request.uuid)  AppConfig.session.uuid  = request.uuid;
                            if (request.timeout) AppConfig.session.timeout = request.timeout;
                        
                            cbresponse(response.data, response.status, response.config);
                        };
                        
                        
                        if (!query.token) query.token = AppConfig.session.token; // add token to provided query
                        if (!query.reqid) query.reqid = action; // use action as default requestID
                        var handle= $http.get('/api/' + plugin + '/' + action , {params: query}).then(onsuccess, onerror);
                        
                    }
                };
                return myCalls;
            });

})();