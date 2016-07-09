# Application Framework Service Template

## Instructions

Duplicate directory and adjust names. In particular, replace 'xxxxxx' by a proper service name.

* adjust CMakeLists.txt (project name and version)
* ajdust config.xml (description, author, license...)
* rename xxxxxx-service-binding.c to something more meaningful
* update icon file (if name is changed, update the variable PROJECT_ICON in CMakeLists.txt)

## Build

Run:

```
cmake
make
```

## Deployment

Copy the .wgt file on target and install it:

```
$ BOARDIP=1.2.3.4
$ scp *.wgt root@$BOARDIP:/tmp
$ ssh root@$BOARDIP
# afm-util install /tmp/*.wgt
# afm-util list
```

## Run service manually

On the target board:

```
# afb-daemon --token=qwerty --ldpaths=/usr/share/afm/applications/xxxxxx-service/0.1/ --port=5555 --rootdir=. --verbose --verbose --verbose --verbose --verbose
```

## Test using curl

```
# curl -v http://localhost:5555/api/xxxxxx/ping
*   Trying 127.0.0.1...
* Connected to localhost (127.0.0.1) port 5555 (#0)
> GET /api/xxxxxx/ping HTTP/1.1
> Host: localhost:5555
> User-Agent: curl/7.44.0
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: Keep-Alive
< Content-Length: 184
< Set-Cookie: x-afb-uuid-5555=30ab9573-cbc8-43f7-b385-0186feebc69a; Path=/api; Max-Age=3600; HttpOnly
< Date: Sun, 10 Jul 2016 00:09:14 GMT
< 
* Connection #0 to host localhost left intact
{"response":"Some String","jtype":"afb-reply","request":{"status":"success","info":"Ping Binder Daemon tag=pingSample count=1 query={ }","uuid":"30ab9573-cbc8-43f7-b385-0186feebc69a"}}root@porter:~# 
```


