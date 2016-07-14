###########################################################################
# Copyright 2016 IoT.bzh
#
# author: José Bollo <jose.bollo@iot.bzh>
# author: Stéphane Desneux <stephane.desneux@iot.bzh>
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###########################################################################

project(cpu-hybrid)

cmake_minimum_required(VERSION 3.3)

include(GNUInstallDirs)

set(PROJECT_ICON "icon_hybrid_128.png")
set(PROJECT_VERSION "0.1")
set(PROJECT_LIBDIR "lib")

set(CMAKE_BUILD_TYPE Debug)

###########################################################################

link_libraries(-Wl,--as-needed -Wl,--gc-sections)

add_compile_options(-Wall -Wextra -Wconversion)
add_compile_options(-Wno-unused-parameter) # frankly not using a parameter does it care?
add_compile_options(-Werror=maybe-uninitialized)
add_compile_options(-Werror=implicit-function-declaration)
add_compile_options(-ffunction-sections -fdata-sections)
add_compile_options(-Wl,--as-needed -Wl,--gc-sections)
add_compile_options(-fPIC)

set(CMAKE_C_FLAGS_PROFILING    "-g -O0 -pg -Wp,-U_FORTIFY_SOURCE")
set(CMAKE_C_FLAGS_DEBUG        "-g -O0 -ggdb -Wp,-U_FORTIFY_SOURCE")
set(CMAKE_C_FLAGS_RELEASE      "-g -O2")
set(CMAKE_C_FLAGS_CCOV         "-g -O2 --coverage")

###########################################################################

include(FindPkgConfig)

pkg_check_modules(EXTRAS REQUIRED json-c afb-daemon)
add_compile_options(${EXTRAS_CFLAGS})
include_directories(${EXTRAS_INCLUDE_DIRS})
link_libraries(${EXTRAS_LIBRARIES})

###########################################################################
# the binding for afb

message(STATUS "Creation of ${PROJECT_NAME} for AFB-DAEMON")

###############################################################
add_library(${PROJECT_NAME} MODULE ${PROJECT_NAME}-binding.c
                                   ${PROJECT_NAME}-app.qml)
set_target_properties(${PROJECT_NAME} PROPERTIES
	PREFIX ""
	LINK_FLAGS "-Wl,--version-script=${CMAKE_CURRENT_SOURCE_DIR}/export.map"
)

configure_file(config.xml.in config.xml)

add_custom_command(
	OUTPUT ${PROJECT_NAME}.wgt
	DEPENDS ${PROJECT_NAME}
	COMMAND rm -rf package
	COMMAND mkdir -p package/${PROJECT_LIBDIR} package/htdocs
	COMMAND cp ${CMAKE_CURRENT_SOURCE_DIR}/../icons/${PROJECT_ICON} config.xml package/
	COMMAND cp ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_NAME}-app.qml package/
	COMMAND cp ${PROJECT_NAME}.so package/${PROJECT_LIBDIR}
	COMMAND wgtpkg-pack -f -o ${PROJECT_NAME}.wgt package 
	#COMMAND rm -rf package
)
add_custom_target(widget ALL DEPENDS ${PROJECT_NAME}.wgt)

