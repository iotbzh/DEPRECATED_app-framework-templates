/*
 * Copyright (C) 2015, 2016 "IoT.bzh"
 * Author "Fulup Ar Foll"
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
#include <stdio.h>
#include <string.h>
#include <json-c/json.h>

#include <afb/afb-plugin.h>

const struct AFB_interface *interface;

struct event
{
	struct event *next;
	struct afb_event event;
	char tag[1];
};

static struct event *events = 0;

/* searchs the event of tag */
static struct event *event_get(const char *tag)
{
	struct event *e = events;
	while(e && strcmp(e->tag, tag))
		e = e->next;
	return e;
}

/* deletes the event of tag */
static int event_del(const char *tag)
{
	struct event *e, **p;

	/* check exists */
	e = event_get(tag);
	if (!e) return -1;

	/* unlink */
	p = &events;
	while(*p != e) p = &(*p)->next;
	*p = e->next;

	/* destroys */
	afb_event_drop(e->event);
	free(e);
	return 0;
}

/* creates the event of tag */
static int event_add(const char *tag, const char *name)
{
	struct event *e;

	/* check valid tag */
	e = event_get(tag);
	if (e) return -1;

	/* creation */
	e = malloc(strlen(tag) + sizeof *e);
	if (!e) return -1;
	strcpy(e->tag, tag);

	/* make the event */
	e->event = afb_daemon_make_event(interface->daemon, name);
	if (!e->event.closure) { free(e); return -1; }

	/* link */
	e->next = events;
	events = e;
	return 0;
}

static int event_subscribe(struct afb_req request, const char *tag)
{
	struct event *e;
	e = event_get(tag);
	return e ? afb_req_subscribe(request, e->event) : -1;
}

static int event_unsubscribe(struct afb_req request, const char *tag)
{
	struct event *e;
	e = event_get(tag);
	return e ? afb_req_unsubscribe(request, e->event) : -1;
}

static int event_push(struct json_object *args, const char *tag)
{
	struct event *e;
	e = event_get(tag);
	return e ? afb_event_push(e->event, json_object_get(args)) : -1;
}

// Sample Generic Ping Debug API
static void ping(struct afb_req request, json_object *jresp, const char *tag)
{
	static int pingcount = 0;
	json_object *query = afb_req_json(request);
	afb_req_success_f(request, jresp, "Ping Binder Daemon tag=%s count=%d query=%s", tag, ++pingcount, json_object_to_json_string(query));
}

static void pingSample (struct afb_req request)
{
	ping(request, json_object_new_string ("Some String"), "pingSample");
}

static void pingFail (struct afb_req request)
{
	afb_req_fail(request, "failed", "Ping Binder Daemon fails");
}

static void pingNull (struct afb_req request)
{
	ping(request, NULL, "pingNull");
}

static void pingBug (struct afb_req request)
{
	ping((struct afb_req){NULL,NULL,NULL}, NULL, "pingBug");
}

static void pingEvent(struct afb_req request)
{
	json_object *query = afb_req_json(request);
	afb_daemon_broadcast_event(interface->daemon, "event", json_object_get(query));
	ping(request, json_object_get(query), "event");
}


// For samples https://linuxprograms.wordpress.com/2010/05/20/json-c-libjson-tutorial/
static void pingJson (struct afb_req request) {
    json_object *jresp, *embed;

    jresp = json_object_new_object();
    json_object_object_add(jresp, "myString", json_object_new_string ("Some String"));
    json_object_object_add(jresp, "myInt", json_object_new_int (1234));

    embed  = json_object_new_object();
    json_object_object_add(embed, "subObjString", json_object_new_string ("Some String"));
    json_object_object_add(embed, "subObjInt", json_object_new_int (5678));

    json_object_object_add(jresp,"eobj", embed);

    ping(request, jresp, "pingJson");
}

static void subcallcb (void *prequest, int iserror, json_object *object)
{
	struct afb_req request = afb_req_unstore(prequest);
	if (iserror)
		afb_req_fail(request, "failed", json_object_to_json_string(object));
	else
		afb_req_success(request, object, NULL);
	afb_req_unref(request);
}

static void subcall (struct afb_req request)
{
	const char *api = afb_req_value(request, "api");
	const char *verb = afb_req_value(request, "verb");
	const char *args = afb_req_value(request, "args");
	json_object *object = api && verb && args ? json_tokener_parse(args) : NULL;

	if (object == NULL)
		afb_req_fail(request, "failed", "bad arguments");
	else
		afb_req_subcall(request, api, verb, object, subcallcb, afb_req_store(request));
}

static void eventadd (struct afb_req request)
{
	const char *tag = afb_req_value(request, "tag");
	const char *name = afb_req_value(request, "name");

	if (tag == NULL || name == NULL)
		afb_req_fail(request, "failed", "bad arguments");
	else if (0 != event_add(tag, name))
		afb_req_fail(request, "failed", "creation error");
	else
		afb_req_success(request, NULL, NULL);
}

static void eventdel (struct afb_req request)
{
	const char *tag = afb_req_value(request, "tag");

	if (tag == NULL)
		afb_req_fail(request, "failed", "bad arguments");
	else if (0 != event_del(tag))
		afb_req_fail(request, "failed", "deletion error");
	else
		afb_req_success(request, NULL, NULL);
}

static void eventsub (struct afb_req request)
{
	const char *tag = afb_req_value(request, "tag");

	if (tag == NULL)
		afb_req_fail(request, "failed", "bad arguments");
	else if (0 != event_subscribe(request, tag))
		afb_req_fail(request, "failed", "subscription error");
	else
		afb_req_success(request, NULL, NULL);
}

static void eventunsub (struct afb_req request)
{
	const char *tag = afb_req_value(request, "tag");

	if (tag == NULL)
		afb_req_fail(request, "failed", "bad arguments");
	else if (0 != event_unsubscribe(request, tag))
		afb_req_fail(request, "failed", "unsubscription error");
	else
		afb_req_success(request, NULL, NULL);
}

static void eventpush (struct afb_req request)
{
	const char *tag = afb_req_value(request, "tag");
	const char *data = afb_req_value(request, "data");
	json_object *object = data ? json_tokener_parse(data) : NULL;

	if (tag == NULL)
		afb_req_fail(request, "failed", "bad arguments");
	else if (0 > event_push(object, tag))
		afb_req_fail(request, "failed", "push error");
	else
		afb_req_success(request, NULL, NULL);
}

// NOTE: this sample does not use session to keep test a basic as possible
//       in real application most APIs should be protected with AFB_SESSION_CHECK
static const struct AFB_verb_desc_v1 verbs[]= {
  {"ping"     , AFB_SESSION_NONE, pingSample  , "Ping the binder"},
  {"pingfail" , AFB_SESSION_NONE, pingFail    , "Ping that fails"},
  {"pingnull" , AFB_SESSION_NONE, pingNull    , "Ping which returns NULL"},
  {"pingbug"  , AFB_SESSION_NONE, pingBug     , "Do a Memory Violation"},
  {"pingJson" , AFB_SESSION_NONE, pingJson    , "Return a JSON object"},
  {"pingevent", AFB_SESSION_NONE, pingEvent   , "Send an event"},
  {"subcall",   AFB_SESSION_NONE, subcall     , "Call api/verb(args)"},
  {"eventadd",  AFB_SESSION_NONE, eventadd    , "adds the event of 'name' for the 'tag'"},
  {"eventdel",  AFB_SESSION_NONE, eventdel    , "deletes the event of 'tag'"},
  {"eventsub",  AFB_SESSION_NONE, eventsub    , "subscribes to the event of 'tag'"},
  {"eventunsub",AFB_SESSION_NONE, eventunsub  , "unsubscribes to the event of 'tag'"},
  {"eventpush", AFB_SESSION_NONE, eventpush   , "pushes the event of 'tag' with the 'data'"},
  {NULL}
};

static const struct AFB_plugin plugin_desc = {
	.type = AFB_PLUGIN_VERSION_1,
	.v1 = {
		.info = "xxxxxx service",
		.prefix = "xxxxxx",
		.verbs = verbs
	}
};

const struct AFB_plugin *pluginAfbV1Register (const struct AFB_interface *itf)
{
	interface = itf;
	return &plugin_desc;
}
