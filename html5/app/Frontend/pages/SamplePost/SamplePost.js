(function() {
'use strict';

// list all rependencies within the page + controler if needed
angular.module('SamplePostModule', ['SubmitButton','UploadFiles'])

  .controller('SamplePostController', function ($http) {
        var scope = this; // I hate JavaScript

        console.log ("sample Init");
        
        scope.FileUploaded = function (response) {
           console.log ("FileUploaded response=%s", JSON.stringify(response));
        };
   });

console.log ("PostSampleController Loaded");
})(); 