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

project(xxxxxx-qml)

cmake_minimum_required(VERSION 3.3)

include(GNUInstallDirs)

set(PROJECT_ICON "icon_qml_128.png")
set(PROJECT_VERSION "0.1")

set(CMAKE_BUILD_TYPE Debug)

###########################################################################
# the binding for afb

message(STATUS "Creation of ${PROJECT_NAME} for AFB-DAEMON")

###############################################################
configure_file(config.xml.in config.xml)

add_custom_command(
	OUTPUT ${PROJECT_NAME}.wgt
	COMMAND rm -rf package
	COMMAND mkdir -p package/
	COMMAND cp ${CMAKE_CURRENT_SOURCE_DIR}/../icons/${PROJECT_ICON} config.xml package/
	COMMAND cp ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_NAME}-app.qml package/
	COMMAND wgtpkg-pack -f -o ${PROJECT_NAME}.wgt package 
	COMMAND rm -rf package
)
add_custom_target(widget ALL DEPENDS ${PROJECT_NAME}.wgt)

