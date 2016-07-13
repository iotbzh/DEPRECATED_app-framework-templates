# Application Framework - Service Template

## Instructions

Duplicate directory and adjust names. In particular, replace 'xxxxxx' by a proper service name.

* adjust CMakeLists.txt (project name and version)
* ajdust config.xml (description, author, license...)
* rename xxxxxx-service-binding.c to something meaningful
* store icon file in icons directory and update the variable PROJECT_ICON in CMakeLists.txt

## Build

Run:

```
mkdir build
cd build
cmake ..
make
```

## Deployment

Copy the .wgt file on the target through ssh and install it (adjust BOARDIP to your real IP address):

```
$ BOARDIP=1.2.3.4
$ scp xxxxxx-service.wgt root@$BOARDIP:/tmp
$ ssh root@$BOARDIP
# afm-util install /tmp/xxxxxx-service.wgt
# afm-util list
```

## Run service manually

On the target board:

```
# afm-util start xxxxxx-server@0.1
# ps -ef| grep afb-daemon | grep xxx
```

## Test using curl

```
# PORT=12345 # adjust the port depending in on afb-daemon instance: use ps -ef to check
# curl -v http://localhost:$PORT/api/xxxxxx/ping
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


