import QtQuick 2.0
import QtQuick.Window 2.0
import QtQuick.Controls 1.4
import QtWebSockets 1.0

Window {
	 // VARIABLES

	property string port_str: Qt.application.arguments[1]
	property string token_str: Qt.application.arguments[2]
	property string address_str: "ws://localhost:"+port_str+"/api?token="+token_str
	property string api_str: "cpu"
	property string verb_str: ""
	property var msgid_enu: { "call":2, "retok":3, "reterr":4, "event":5 }
	property string request_str: ""
	property string status_str: ""
	property int count: 0
	property string load_str: ""

	 // WINDOW PROPERTIES

	visible: true
	width: 340
	height: 240

	 // WEBSOCKET WIDGET (MAIN LOGIC)

	WebSocket {
		id: websocket
		url: address_str
		onTextMessageReceived: {
			 // VERB RESPONSE VALIDATION
			var message_json = JSON.parse (message)
			var request_json = message_json[2].request
			if (message_json[0] != msgid_enu.retok) {
				console.log ("Return value is not ok !")
				return
			}
			 // VERB RESPONSE PARSING AND LOGIC
			if (verb_str == "count") {
				 // display CPU count
				count = request_json.info
				 // activate CPU load combobox and start timer
				load_combobox_list.clear()
				for (var i = 0; i < count; i++)
					load_combobox_list.append({"text":"CPU"+i})
				load_combobox.enabled = true
				load_timer.running = true
			} else if (verb_str == "load") {
				 // display CPU load
				load_str = request_json.info
			}
		}
		onStatusChanged: {
			if (websocket.status == WebSocket.Error) {
				status_str = "WebSocket error: " + websocket.errorString
			} else if (websocket.status == WebSocket.Open) {
				// count CPUs as soon as socket is opened
				verb_str = "count"
				request_str = '[' + msgid_enu.call + ',"99999","' + api_str+'/'+verb_str + '", null ]';
				websocket.sendTextMessage (request_str)
			}
		}
		active: true
	}

	 // OTHER WIDGETS

	Rectangle {
		anchors.left: parent.left
		anchors.top: parent.top
		anchors.horizontalCenter: parent.horizontalCenter
		anchors.margins: 20

		 // TITLE SECTION
		Label {
			text: "QML Websocket CPU Application"
			font.pixelSize: 18
			font.bold: true
			anchors.centerIn: parent
			y: 0
		}
		Text {
			id: url_notifier
			text: "<b>URL:</b> " + websocket.url
			y: 20
		}

		 // COUNT SECTION
		Text {
			id: count_notifier
			text: "<b>CPU count:</b> " + count
			anchors.horizontalCenter: parent.horizontalCenter
			y: 60
		}
		Button {
			id: count_button
			text: "Re-count CPUs"
			onClicked: {
				verb_str = "count"
				request_str = '[' + msgid_enu.call + ',"99999","' + api_str+'/'+verb_str + '", null ]'
				websocket.sendTextMessage (request_str)
			}
			anchors.horizontalCenter: parent.horizontalCenter
			y: 80
		} 

		 // LOAD SECTION
		Row {
			ComboBox {
				id: load_combobox
				model: ListModel { id: load_combobox_list }
				width: 80
				enabled: false
			}
			Text { text: "<b>load:</b> " + load_str }
			anchors.horizontalCenter: parent.horizontalCenter
			spacing:5
			y: 120
		}
		Timer {
			id: load_timer
			interval: 5000
			repeat: true
			onTriggered: {
				verb_str = "load"
				request_str = '[' + msgid_enu.call + ',"99999","' + api_str+'/'+verb_str + '",{"num":"' + load_combobox.currentIndex + '"}, ]'
				websocket.sendTextMessage (request_str)
			}
			running: false
		}

		 // STATUS SECTION
		Text {
			id: status_notifier
			text: status_str
			y: 200
		}
	}

}
