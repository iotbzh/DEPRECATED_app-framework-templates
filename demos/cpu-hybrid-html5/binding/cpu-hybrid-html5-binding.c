/*
 * Copyright (C) 2015, 2016 "IoT.bzh"
 * Author "Manuel Bachmann"
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
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <json-c/json.h>

#define AFB_BINDING_VERSION 2
#include <afb/afb-binding.h>

#include <time.h>
#include <systemd/sd-event.h>
#define MAXCPUS 16
static long cpucount;
static long double loadpast[4][MAXCPUS], loadnow[4][MAXCPUS], load[MAXCPUS];

static void ping (struct afb_req request)
{
	static int pingcount = 0;

	json_object *query = afb_req_json(request);
	afb_req_success_f(request, NULL, "Ping Binder Daemon count=%d query=%s", ++pingcount, json_object_to_json_string(query));
}

static void CPUCount (struct afb_req request)
{
	char cpucount_str[2];

	snprintf (cpucount_str, 2, "%ld", cpucount);
	afb_req_success(request, NULL, cpucount_str);
}

static char* LookupStringInFile (char *string, char *filename)
{
	FILE *file;
	char *line;

	file = fopen (filename, "r");
	line = malloc (256);
	/* lookup string on file line, stop there if found */
	while (fgets (line, 256, file)) {
		if (strstr (line, string))
			break;
	}
	fclose(file);

	return line;
}

static int MeasureCPULoad (sd_event_source *src, uint64_t now, void *data)
{
	sd_event *loop = (sd_event *)data;
	char cpuname[6] = "cpu";
	char num_str[2];
	int num, i;
	char *line;

	/* iterate on each CPU */
	for (num = 0; num < cpucount; num++) {
		cpuname[3] ='\0';
		/* construct lookup string ("cpu1" e.g.) */
		snprintf (num_str, 2, "%d", num);
		strncat (cpuname, num_str, 2);

		/* lookup string in file, get current load values */
		line = LookupStringInFile(cpuname, "/proc/stat");
		sscanf (line, "%*s %Lf %Lf %Lf %Lf", &loadnow[0][num], &loadnow[1][num],
						     &loadnow[2][num], &loadnow[3][num]);
		free (line);

		/* calculate average load by comparing with previous load */
		load[num] = ((loadnow[0][num]+loadnow[1][num]+loadnow[2][num])
					  - (loadpast[0][num]+loadpast[1][num]+loadpast[2][num])) /
					((loadnow[0][num]+loadnow[1][num]+loadnow[2][num]+loadnow[3][num])
					  - (loadpast[0][num]+loadpast[1][num]+loadpast[2][num]+loadpast[3][num]));

		/* store current load values as previous ones */
		for (i = 0; i < 4; i++)
			loadpast[i][num] = loadnow[i][num];
	}

	/* re-fire the function in 5 seconds ("now" + 5 microseconds) */
	sd_event_add_time (loop, &src, CLOCK_MONOTONIC, now+5000000, 0,
					   MeasureCPULoad, loop);

	return 1;
}

static void CPULoad (struct afb_req request)
{
	const char *num_str = afb_req_value (request, "num");
	int num;
	char load_str[4];

	/* no "num" argument was given : fail */
	if (!num_str)
		afb_req_fail (request, "failed", "please provide CPU number as argument");

	/* prevent negative number, or superior to CPU count */
	num = atoi (num_str);
	if ((num < 0) || (num >= cpucount)) {
		afb_req_fail (request, "failed", "invalid CPU number argument");
		return;
	}

	/* convert load to readable format and return it */
	snprintf (load_str, 4, "%.0Lf%%", load[num]*100);
	afb_req_success(request, NULL, load_str);
}

static int preinit()
{
        AFB_NOTICE("binding preinit (was register)");
        return 0;
}

static int init()
{
        AFB_NOTICE("binding init");
	sd_event *loop;
	sd_event_source *src;
	uint64_t now;
	int i;

	/* get CPU count, limiting it to MAXCPUS (default : 16) */
	cpucount = sysconf(_SC_NPROCESSORS_ONLN);
	if (cpucount > MAXCPUS)
		cpucount = MAXCPUS;

	/* initialize past load to 0 for each CPU */
	for (i = 0; i < cpucount; i++)
		loadpast[0][i] = loadpast[1][i]	= loadpast[2][i] = loadpast[3][i] = 0;

	/* register the CPU load measuring function, fires immediately ("now") */
	loop = afb_daemon_get_event_loop ();
	sd_event_now (loop, CLOCK_MONOTONIC, &now);
	sd_event_add_time (loop, &src, CLOCK_MONOTONIC, now, 0,
					   MeasureCPULoad, loop);

        return 0;
}


static const struct afb_verb_v2 verbs[]= {
  { "ping" , ping     , NULL, "Ping the binder",                           AFB_SESSION_NONE},
  { "count", CPUCount , NULL, "returns number of CPUs on target board",    AFB_SESSION_NONE},
  { "load" , CPULoad  , NULL, "returns designated CPU load on target board", AFB_SESSION_NONE},
  { NULL}
};

const struct afb_binding_v2 afbBindingV2 = {
		.api = "cpu",
		.specification = NULL,
		.verbs = verbs,
		.preinit = preinit,
		.init = init
};
