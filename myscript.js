/**
 * myscript
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-10-12 18:00:09
 * @version $Id$
 */
var connectCount = 0,
	maxConnectRetryCount = 12;
function init(){
	var args = arguments;
	if (maxConnectRetryCount <= connectCount) return;
	try{
		var chromeMessageObj = ChromeMessage();
		chromeMessageObj.postMessage({
			channel: 'init/success',
			data: {
				version: '2.0'
			}
		});
	}catch(e){
		connectCount++;
		console.log('连接失败！5秒后再次连接...');
		setTimeout(args.callee,5000)
	}
}

setTimeout(init,5000);

// // 监听chrome的消息
// chromeMessageObj.onChromeMessage(function(source){
// 	console.log('chrome',source);
// });

/**
 * 代理WEB与chrome的消息组件
 */
function ChromeMessage(){
	var that = {},
		conf,
		bindEvent,
		chromeMessgeBox = document.getElementById('chrome-message-box');

	if(!chromeMessgeBox) return;
		
	chromeMessgeBox.addEventListener('onChromeMessage',function(){
		var data = JSON.parse(chromeMessgeBox.innerHTML);
		var port = chrome.extension.connect();
		console.log('收到页面的请求数据',data);
		port.postMessage(data);
	});

	function postMessage(source){
		chromeMessgeBox.setAttribute('msg-data-type','data');
		chromeMessgeBox.innerHTML = JSON.stringify(source);
		console.log('chrome通信中间层：',source);
	}

	/**
	 * 监听
	 * @param   {Function}  callback  [description]
	 * @return  {[type]}              [description]
	 */
//	that.onChromeMessage = function(callback){
		chrome.extension.onRequest.addListener(
		  function(source, sender, sendResponse) {
		  	try{
		  		that.postMessage(source)
		  	}catch(e){
		  		console.log(e.message);
		  	}
		});
//	}
	
	that.postMessage = postMessage;
	return that;
}