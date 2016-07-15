import QtQuick 2.0
import QtQuick.Window 2.0
import QtQuick.Controls 1.4
import QtWebSockets 1.0

Window {
	 // VARIABLES

	property string port_str: Qt.application.arguments[1]
	property string token_str: Qt.application.arguments[2]
	property string address_str: "ws://localhost:"+port_str+"/api?token="+token_str
	property string request_str: ""
	property string status_str: "waiting..."
	property var msgid_enu: { "call":2, "retok":3, "reterr":4, "event":5 }

	 // WINDOW PROPERTIES

	visible: true
	width: 340
	height: 160

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
				status_str = "Bad return value, binding probably not installed"
				return
			}
			 // VERB RESPONSE PARSING AND LOGIC
			status_str = request_json.info
		}
		onStatusChanged: {
			if (websocket.status == WebSocket.Error)
				status_str = "WebSocket error: " + websocket.errorString
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
			text: "QML Websocket Sample Application"
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

		 // PING BUTTON
		Button {
			text: "Ping!"
			onClicked: {
				request_str = '[' + msgid_enu.call + ',"99999","xxxxxx/ping", null ]';
				websocket.sendTextMessage (request_str)
			}
			anchors.horizontalCenter: parent.horizontalCenter
			y: 60
		}

		 // STATUS SECTION
		Text {
			id: status_notifier
			text: "<b>Status</b>: " + status_str
			y: 100
		}
	}

}
