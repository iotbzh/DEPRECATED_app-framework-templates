# Template HTML5 Application for Application Framework Binder

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
        APPNAME : 'xxxxxx-html5',   // AppName is use as main Angular Module name
        FRONTEND: "Frontend",    // HTML5 frontend  [no leading ./]
        BACKEND : "Backend",     // NodeJS Rest API [no leading ./]
        URLBASE : '/opa/',       // HTML basedir when running in production [should end with a /]
        APIBASE : '/api/',       // Api url base dir [should end with a /]
    };
    module.exports = config;
```

WARNING: in current development version Frontend/services/AppConfig.js is not updated automatically
you should manually assert that backend config is in sync with frontend config.

## Development build and deployment (development phase)

```
$ gulp help
$ gulp build-app-dev
$ BOARDIP=1.2.3.4    # change by your board IP address
$ rsync -Pav dist.dev/ root@$BOARDIP:xxxxxx-html5-dev/
```

## Test Application

Start AppFramework Binder:

```
$ ssh root@$BOARDIP
# afb-daemon --port=1234 --verbose --token=123456789 --rootdir=~/xxxxxx-html5-dev
```

Point your browser onto: http://$BOARDIP:1234/opa?token=123456789

Note: 
	- do not forget '/opa' that should match with your config.URLBASE
	- if you change --token=xxxx do not forget to update ./Frontend/pages/HomeModules.js
	- Force HTML/OPA reload with F5 after each HTML5/OPA update or new pages may not be loaded. 
	- When reloading HTML/OPA with F5 do not forget that your initial token wont be accepted anymore. You should either:
		+ restart to clean existing session
		+ cleanup AJB_session cookie
		+ start an anonymous web page to get a fresh and clean environment.

## Create application package and install on target

Simply run:

```
$ gulp widget-prod
```

This should produce a .wgt file in the current directory. You can then install the widget file onto the target and run the application using application framework utilities:

```
$ scp *.wgt root@$BOARDIP:~/
$ ssh root@$BOARDIP
# afm-util install xxxxxx-html5.wgt
# afm-util start xxxxxx-html5@0.1
```

## Directory structure
    /AppClient
    |
    |---- package.json
    |---- bower.json
    |---- gulpfile.js
    |
    |---- /Frontend
    |     |
    |     |---- index.html
    |     |---- app.js
    |     |
    |     |---- /styles
    |     |     |
    |     |     |---- _settings.scss
    |     |     |---- app.scss
    |     |
    |     |---- /Widgets
    |     |     |
    |     |     |--- Widget-1
    |     |     |...
    |     |
    |     |-----/Pages
    |           |--- Home-Page
    |           |... 
    |
    |
    |---- (/dist.dev)
    |---- (/dist.prod)

