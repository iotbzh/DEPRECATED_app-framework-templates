/*
 * Copyright (C) 2015, 2016 "IoT.bzh"
 * Author "Fulup Ar Foll" <fulup@iot.bzh>
 * Author José Bollo <jose.bollo@iot.bzh>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#define _GNU_SOURCE

#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <errno.h>

#include <systemd/sd-event.h>

#include <afb/afb-wsj1.h>
#include <afb/afb-ws-client.h>

/* declaration of functions */
static void on_hangup(void *closure, struct afb_wsj1 *wsj1);
static void on_call(void *closure, const char *api, const char *verb, struct afb_wsj1_msg *msg);
static void on_event(void *closure, const char *event, struct afb_wsj1_msg *msg);
static int io_event_callback(sd_event_source *src, int fd, uint32_t revents, void *closure);
static void emit(const char *api, const char *verb, const char *object);

/* the callback interface for wsj1 */
static struct afb_wsj1_itf itf = {
	.on_hangup = on_hangup,
	.on_call = on_call,
	.on_event = on_event
};

/* global variables */
static struct afb_wsj1 *wsj1;
static int exonrep;
static int callcount;
static sd_event_source *evsrc;

/* print usage of the program */
static void usage(int status, char *arg0)
{
	char *name = strrchr(arg0, '/');
	name = name ? name + 1 : arg0;
	fprintf(status ? stderr : stdout, "usage: %s uri [api verb [data]]\n", name);
	exit(status);
}

static struct sd_event *_get_event_loop()
{
    static struct sd_event *result = NULL;
	int rc;
	if (result == NULL) {
		rc=sd_event_new(&result);
		if (rc<0) {
			errno = -rc;
			result = NULL;
		}
	}
	return result;
}

/* entry function */
int main(int ac, char **av, char **env)
{
	/* check the argument count */
	if (ac != 2 && ac != 4 && ac != 5)
		usage(1, av[0]);

	/* emit error and exit if requested */
	if (!strcmp(av[1], "-h") || !strcmp(av[1], "--help"))
		usage(0, av[0]);

	/* connect the websocket wsj1 to the uri given by the first argument */
	wsj1 = afb_ws_client_connect_wsj1(av[1], &itf, NULL);
	if (wsj1 == NULL) {
		fprintf(stderr, "connection to %s failed: %m\n", av[1]);
		return 1;
	}

	/* test the behaviour */
	if (ac == 2) {
		/* get requests from stdin */
		fcntl(0, F_SETFL, O_NONBLOCK);
		sd_event_add_io(_get_event_loop(), &evsrc, 0, EPOLLIN, io_event_callback, NULL);
	} else {
		/* the request is defined by the arguments */
		exonrep = 1;
		emit(av[2], av[3], av[4]);
	}

	/* loop until end */
	for(;;)
		sd_event_run(_get_event_loop(), 30000000);
	return 0;
}

/* called when wsj1 hangsup */
static void on_hangup(void *closure, struct afb_wsj1 *wsj1)
{
	printf("ON-HANGUP\n");
	exit(0);
}

/* called when wsj1 receives a method invocation */
static void on_call(void *closure, const char *api, const char *verb, struct afb_wsj1_msg *msg)
{
	int rc;
	printf("ON-CALL %s/%s(%s)\n", api, verb, afb_wsj1_msg_object_s(msg));
	rc = afb_wsj1_reply_error_s(msg, "\"unimplemented\"", NULL);
	if (rc < 0)
		fprintf(stderr, "replying failed: %m\n");
}

/* called when wsj1 receives an event */
static void on_event(void *closure, const char *event, struct afb_wsj1_msg *msg)
{
	printf("ON-EVENT %s(%s)\n", event, afb_wsj1_msg_object_s(msg));
}

/* called when wsj1 receives a reply */
static void on_reply(void *closure, struct afb_wsj1_msg *msg)
{
	printf("ON-REPLY %s: %s\n", (char*)closure, afb_wsj1_msg_object_s(msg));
	free(closure);
	callcount--;
	if (exonrep && !callcount)
		//afb_wsj1_hangup(afb_wsj1_msg_wsj1(msg));
		exit(0);
}

/* makes a call */
static void call(const char *api, const char *verb, const char *object)
{
	static int num = 0;
	char *key;
	int rc;

	/* allocates an id for the request */
	rc = asprintf(&key, "%d:%s/%s", ++num, api, verb);

	/* send the request */
	callcount++;
	rc = afb_wsj1_call_s(wsj1, api, verb, object, on_reply, key);
	if (rc < 0) {
		fprintf(stderr, "calling %s/%s(%s) failed: %m\n", api, verb, object);
		callcount--;
	}
}

/* sends an event */
static void event(const char *event, const char *object)
{
	int rc;

	rc = afb_wsj1_send_event_s(wsj1, event, object);
	if (rc < 0)
		fprintf(stderr, "sending !%s(%s) failed: %m\n", event, object);
}

/* emits either a call (when api!='!') or an event */
static void emit(const char *api, const char *verb, const char *object)
{
	if (object == NULL || object[0] == 0)
		object = "null";
	if (api[0] == '!' && api[1] == 0)
		event(verb, object);
	else
		call(api, verb, object);
}

/* called when something happens on stdin */
static int io_event_callback(sd_event_source *src, int fd, uint32_t revents, void *closure)
{
	static size_t count = 0;
	static char line[16384];
	static char sep[] = " \t";
	static char sepnl[] = " \t\n";

	ssize_t rc;
	size_t pos;

	/* read the buffer */
	do { rc = read(0, line + count, sizeof line - count); } while (rc < 0 && errno == EINTR);
	if (rc < 0) {
		fprintf(stderr, "read error: %m\n");
		exit(1);
	}
	if (rc == 0) {
		if (!callcount)
			exit(0);
		exonrep = 1;
		sd_event_source_unref(evsrc);
	}
	count += (size_t)rc;

	/* normalise the buffer content */
	/* TODO: handle backspace \x7f ? */

	/* process the lines */
	pos = 0;
	for(;;) {
		size_t i, api[2], verb[2], rest[2];
		i = pos;
		while(i < count && strchr(sep, line[i])) i++;
		api[0] = i; while(i < count && !strchr(sepnl, line[i])) i++; api[1] = i;
		while(i < count && strchr(sep, line[i])) i++;
		verb[0] = i; while(i < count && !strchr(sepnl, line[i])) i++; verb[1] = i;
		while(i < count && strchr(sep, line[i])) i++;
		rest[0] = i; while(i < count && line[i] != '\n') i++; rest[1] = i;
		if (i == count) break;
		line[i++] = 0;
		if (api[0] == api[1] || verb[0] == verb[1])
			fprintf(stderr, "bad line: %s\n", line+pos);
		else {
			line[api[1]] = line[verb[1]] = 0;
			emit(line + api[0], line + verb[0], line + rest[0]);
		}
		pos = i;
	}
	count -= pos;
	if (count == sizeof line) {
		fprintf(stderr, "overflow\n");
		exit(1);
	}
	if (count)
		memmove(line, line + pos, count);
	return 1;
}

