# CPU Hybrid HTML5 Application for Application Framework Binder

## Setup

Install HTML5 development toolchain on your host

```
$ curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
$ sudo apt-get install nodejs
$ sudo npm install --global gulp

```

Then install NodeJS dependencies 

```
$ cd html5     # or the project directory
$ npm install
```

## Overload ./app/etc/AppDefaults.js with '.noderc.js'

```
    var config= {
        APPNAME : 'cpu-hybrid-html5',   // AppName is use as main Angular Module name
        FRONTEND: "Frontend",    // HTML5 frontend  [no leading ./]
        BACKEND : "Backend",     // NodeJS Rest API [no leading ./]
        URLBASE : '/opa/',       // HTML basedir when running in production [should end with a /]
        APIBASE : '/api/',       // Api url base dir [should end with a /]
    };
    module.exports = config;
```

WARNING: in current development version Frontend/services/AppConfig.js is not updated automatically
you should manually assert that backend config is in sync with frontend config.

## Build widget

```
$ mkdir build && cd build
$ cmake ..
$ make
```

This should give a .wgt file ready to be deployed on the target.

## Deploy application package

Run:

```
$ scp *.wgt root@$BOARDIP:~/
$ ssh root@$BOARDIP
# afm-util install cpu-hybrid-html5.wgt
# afm-util start cpu-hybrid-html5@0.1
```

