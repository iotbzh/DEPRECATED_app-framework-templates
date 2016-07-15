import QtQuick 2.0
import QtQuick.Window 2.0
import QtQuick.Controls 1.4

Window {
	 // WINDOW PROPERTIES

	visible: true
	width: 320
	height: 240

	 // WIDGETS

	Rectangle {
		anchors.centerIn: parent

		Column {
			Label {
				text: "Hello World!"
				font.pixelSize: 28
				font.bold: true
				anchors.horizontalCenter: parent.horizontalCenter
			}
			Button {
				text: "Quit"
				onClicked: { Qt.quit() }
				anchors.horizontalCenter: parent.horizontalCenter
			}
			anchors.centerIn: parent
			spacing: 20
		}
	}

}
