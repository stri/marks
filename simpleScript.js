/**
 * simpleScript
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-10-12 23:10:13
 * @version $Id$
 */
// 派发分辨率
var port = chrome.extension.connect();
port.postMessage({
	channel: 'screenParam',
	data: {
		width: window.screen.width,
		height: window.screen.height
	}
});