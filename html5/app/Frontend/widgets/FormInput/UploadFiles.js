
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
 * GNU General Public License for more details..
 * 
 * Reference:
 *   https://developer.mozilla.org/en/docs/Web/API/FileReader 
 *   https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications#Using_hidden_file_input_elements_using_the_click%28%29_method
 *   https://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs
 *   https://www.terlici.com/2015/05/16/uploading-files-locally.html
 *   https://github.com/nervgh/angular-file-upload/blob/master/src/services/FileUploader.js
 *   https://stuk.github.io/jszip/documentation/howto/read_zip.html
 *   http://onehungrymind.com/zip-parsing-jszip-angular/
 *   http://stackoverflow.com/questions/15341912/how-to-go-from-blob-to-arraybuffer
 *   
 *   Bugs: zip file sent even when flag as invalid 
 */

 

(function() {
'use strict';

// WARNING: Angular ng-change does not work on input/file. Let's hook our callback through standard JS function
var tmpl =  '<input type="file" name="{{name}}-input" onchange="angular.element(this).scope().UpLoadFile(this.files)" accept="{{mimetype}}" style="display:none">'+
            '<div class="upload-file" ng-click="imgClicked()">' +
            '<img id="{{name}}-img" src="{{thumbnail}}">' +
            '<range-slider ng-show="!noslider" id="{{name}}-slider" automatic=true inithook="SliderInitCB"></range-slider>' +
            '</div>';
    

// Service Create xform insert files in and Post it to url
function LoadFileSvc (scope, elem, posturl, files, thumbnailCB) {
    var xmlReq = new XMLHttpRequest();
    var xform  = new FormData();
    
    var OnLoadCB = function (target) {
        var status = thumbnailCB (target);
        //if (status) xform.append(scope.name, file, file.name);
    };
            // Update slider during Upload
    xmlReq.upload.onprogress = function (event) {
        var progress = Math.round(event.lengthComputable ? event.loaded * 100 / event.total : 0);
        if (scope.slider) scope.slider.setValue (progress);
    };

    // Upload is finish let's notify controler callback
    xmlReq.onload = function () {
        elem.addClass ("success");
        elem.removeClass ("error");
        var response ={
            status : xmlReq.status,
            headers: xmlReq.getAllResponseHeaders() 
        };
        scope.callback (response);
    };

    xmlReq.onerror = function () {
        elem.addClass ("error");
        elem.removeClass ("success");
        var response ={
            status : xmlReq.status,
            headers: xmlReq.getAllResponseHeaders() 
        };
        scope.callback (response);
    };

    xmlReq.onabort = function () {
        elem.addClass ("error");
        elem.removeClass ("success");
        var response ={
            status : xmlReq.status,
            headers: xmlReq.getAllResponseHeaders() 
        };
        scope.callback (response);
    };

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.type.match(scope.mimetype)) {
            continue;
        }

        console.log ("Selected file=" + file.name + " size="+ file.size/1024 + " Type="+ file.type);

        // File to upload is too big
        if (file.size > scope.maxsize*1024) {
            scope.thumbnail = scope.istoobig; // warning if image path is wrong nothing happen
            scope.$apply('thumbnail'); // we short-circuit Angular resync Image
            return;
        }

        // This is not an uploadable file
        if(isNaN(file.size)) {
            scope.thumbnail = scope.isnotvalid; 
            scope.$apply('thumbnail');
            return;
        }

        scope.Basename= file.name.split('/').reverse()[0];
        scope.imgElem[0].file = file;

        // If File is an image let display it now
        if (thumbnailCB) {
            var reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = OnLoadCB;
        } 
        // if everything is OK let's add file to xform
        xform.append(scope.name, file, file.name);
    }


    // everything looks OK let's Post it
    xmlReq.open("POST", posturl , true);
    xmlReq.send(xform);
}

angular.module('UploadFiles',['AppConfig', 'ModalNotification', 'RangeSlider'])

.directive('uploadImage', function(AppConfig,  JQemu, Notification) {
    function mymethods(scope, elem, attrs) {
        
        // get widget image handle from template
        scope.imgElem    = elem.find('img');
        scope.inputElem  = elem.find('input');
        
        // Image was ckick let's simulate an input (file) click
        scope.imgClicked = function () {
            scope.inputElem[0].click(); // Warning Angular TriggerEvent does not work!!!
        };
        
        // Slider control handle registration after creation
        scope.SliderInitCB=function (slider) {
           scope.slider= slider; 
        };
        
        // Upload is delegated to a shared function
        scope.UpLoadFile=function (files) {
            var readerCB = function (upload) {
                // scope.thumbnail = upload.target.result;
                scope.imgElem[0].src = window.URL.createObjectURL(new Blob([upload.target.result], {type: "image"}));                
                return true; // true activates post
            };
            var posturl = attrs.posturl + "?token=" + AppConfig.session.token;
            new LoadFileSvc (scope, elem, posturl, files, readerCB);
        };

        // Initiallize default values from attributes values
        scope.name= attrs.name || 'file';
        scope.category= attrs.category  || 'image';
        scope.mimetype= (attrs.accept || 'image') + '/*';
        scope.maxsize= attrs.maxsize || 100; // default max size 100KB
        scope.regexp = new RegExp (attrs.accept+ '.*','i');

        if (attrs.thumbnail) scope.thumbnail= AppConfig.paths[scope.category] +  attrs.thumbnail;
        else  scope.thumbnail=AppConfig.paths[scope.category] + 'tux-bzh.png';
        
        if (attrs.thumbnail) scope.isnotvalid= AppConfig.paths[scope.category] +  attrs.isnotvalid;
        else  scope.isnotvalid=AppConfig.paths[scope.category] + 'isnotvalid.png';

        if (attrs.istoobig) scope.istoobig= AppConfig.paths[scope.category] +  attrs.istoobig;
        else  scope.istoobig=AppConfig.paths[scope.category] + 'istoobig.png';
        scope.noslider = attrs.noslider || false;

        if (!attrs.posturl) throw new TypeError('file-upload %s posturl=/api/xxxx/xxxx required', scope.attrs);            
    }
    return {
        restrict: 'E',
        template: tmpl,
        link: mymethods,
        scope: {
            callback : '='
        }
    };
})
    
.directive('uploadAudio', function(AppConfig,  JQemu, Notification) {
    function mymethods(scope, elem, attrs) {
        
        // get widget image handle from template
        scope.imgElem    = elem.find('img');
        scope.inputElem  = elem.find('input');
        
        // Image was ckick let's simulate an input (file) click
        scope.imgClicked = function () {
            scope.inputElem[0].click(); // Warning Angular TriggerEvent does not work!!!
        };
        
        // Slider control handle registration after creation
        scope.SliderInitCB=function (slider) {
           scope.slider= slider; 
        };
        
        // Upload is delegated to a shared function
        scope.UpLoadFile=function (files) {
            var posturl = attrs.posturl + "?token=" + AppConfig.session.token;
            new LoadFileSvc (scope, elem, posturl, files, false);
        };

        // Initiallize default values from attributes values
        scope.name= attrs.name || 'audio';
        scope.category= attrs.category  || 'audio';
        scope.mimetype= (attrs.accept || 'audio') + '/*';
        scope.maxsize= attrs.maxsize || 10000; // default max size 10MB
        scope.regexp = new RegExp (attrs.accept+ '.*','i');

        if (attrs.thumbnail) scope.thumbnail= AppConfig.paths[scope.category] +  attrs.thumbnail;
        else  scope.thumbnail=AppConfig.paths[scope.category] + 'upload-music.png';
        
        if (attrs.thumbnail) scope.isnotvalid= AppConfig.paths[scope.category] +  attrs.isnotvalid;
        else  scope.isnotvalid=AppConfig.paths[scope.category] + 'isnotvalid.png';

        if (attrs.istoobig) scope.istoobig= AppConfig.paths[scope.category] +  attrs.istoobig;
        else  scope.istoobig=AppConfig.paths[scope.category] + 'istoobig.png';
        scope.noslider = attrs.noslider || false;

        if (!attrs.posturl) throw new TypeError('file-upload %s posturl=/api/xxxx/xxxx required', scope.attrs);            
    }
    return {
        restrict: 'E',
        template: tmpl,
        link: mymethods,
        scope: {
            callback : '='
        }
    };
    
})

.directive('uploadAppli', function(AppConfig,  JQemu, Notification) {
    function mymethods(scope, elem, attrs) {
        
        // get widget image handle from template
        scope.imgElem    = elem.find('img');
        scope.inputElem  = elem.find('input');
        
        // Image was ckick let's simulate an input (file) click
        scope.imgClicked = function () {
            scope.inputElem[0].click(); // Warning Angular TriggerEvent does not work!!!
        };
        
        // Slider control handle registration after creation
        scope.SliderInitCB=function (slider) {
           scope.slider= slider; 
        };
        
        // Upload is delegated to a shared function
        scope.UpLoadFile=function (files) {
                       
            var readerCB = function (upload) {
                var zipapp = new JSZip(upload.target.result);
                var thumbnail = zipapp.file("afa-pkg/thumbnail.jpg");
                
                // Check is we have a thumbnail within loaded Zipfile
                if (!thumbnail) {
                    console.log ("This is not a valid Application Framework APP");
                    scope.thumbnail=AppConfig.paths[scope.category] + 'isnotvalid.png';
                    scope.$apply('thumbnail'); // we short-circuit Angular resync Image
                    return false; // do not post zip on binder
                } 
                scope.imgElem[0].src = window.URL.createObjectURL(new Blob([thumbnail.asArrayBuffer()], {type: "image"}));                        
                return true; // true activates post
            };
            var posturl = attrs.posturl + "?token=" + AppConfig.session.token;
            new LoadFileSvc (scope, elem, posturl, files, readerCB);
        };

        // Initiallize default values from attributes values
        scope.name= attrs.name || 'appli';
        scope.category= attrs.category  || 'appli';
        scope.mimetype= (attrs.accept || '.zip');
        scope.maxsize= attrs.maxsize || 100000; // default max size 100MB
        scope.regexp = new RegExp (attrs.accept+ '.*','i');

        if (attrs.thumbnail) scope.thumbnail= AppConfig.paths[scope.category] +  attrs.thumbnail;
        else  scope.thumbnail=AppConfig.paths[scope.category] + 'upload-appli.png';
        
        if (attrs.thumbnail) scope.isnotvalid= AppConfig.paths[scope.category] +  attrs.isnotvalid;
        else  scope.isnotvalid=AppConfig.paths[scope.category] + 'isnotvalid.png';

        if (attrs.istoobig) scope.istoobig= AppConfig.paths[scope.category] +  attrs.istoobig;
        else  scope.istoobig=AppConfig.paths[scope.category] + 'istoobig.png';
        scope.noslider = attrs.noslider || false;

        if (!attrs.posturl) throw new TypeError('file-upload %s posturl=/api/xxxx/xxxx required', scope.attrs);            
    }
    return {
        restrict: 'E',
        template: tmpl,
        link: mymethods,
        scope: {
            callback : '='
        }
    };
    
});

console.log ("UploadFile Loaded");
})();
