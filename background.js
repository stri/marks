// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// Or create an HTML notification:
//var notification = webkitNotifications.createHTMLNotification(
// 'notification.html'  // html url - can be relative
//);
			// chrome.bookmarks.getTree(function(source){
			// 	chrome.tabs.sendRequest(tab.id, {data: JSON.stringify(source)});
			// 	// var xhr = new XMLHttpRequest();
			// 	// xhr.open("POST", "http://xinqianduan.sinaapp.com/api/post.php", true);
			// 	// xhr.onreadystatechange = function() {
			// 	// }
			// 	// xhr.send();
			// });

var screenParam = {
	width: 1024,
	height: 768
},
updateWinId,
isSupport = /^http\:\/\/www\.xinqianduan\.com\//gi,
isSharePage = /^http\:\/\/www\.xinqianduan\.com\/share\//gi,
currentWinId;

// 监听其它模块给的数据
chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg){
		// 获取当前屏幕分辨率
		if(msg && msg.channel == 'screenParam'){
			screenParam = msg.data;
		}	

		// 登录成功后
		if(msg && msg.channel == 'login/success'){
			console.log('hahah',msg);
			chrome.windows.getCurrent(function(currentWin){
			//	console.log('currentWin',currentWin);
				chrome.tabs.getSelected(function(currentTab){
					chrome.windows.getAll({
						populate: true
					},function(allWin){
						allWin.forEach(function(win){
							if(updateWinId == win.id){
								chrome.windows.update(win.id,{focused:true},function(){
									win.tabs.forEach(function(tab){
										if(tab.id != currentTab.id && isSupport.test(tab.url)){
							//				console.log('发送数据',msg.data,tab);
											chrome.tabs.sendRequest(tab.id, {channel: "login/success",data: msg.data});
										}
									});
								});
							}
						});
					});
				});
			});
		}

		// 判断窗口
		if(msg && msg.channel == 'window/close'){
			try{
				chrome.windows.remove(updateWinId)
			}catch(e){}
		}

		// 如果是打开登录页
		if(msg && msg.channel == 'login/app/start'){
			currentWinId && chrome.tabs.getAllInWindow(currentWinId,function(source){
				var tabid,
					index = -1,
					len = source.length,
					selected;

				source.forEach(function(tab){
					if(isSupport.test(tab.url)){
						tabid = tab.id;
						index = tab.index;
						selected = tab.selected;
					}
				});

				if(tabid && index != -1){
					chrome.tabs.update(tabid,{
						selected: true
					},function(){
						chrome.tabs.getSelected(currentWinId, function(tab) {
						  chrome.tabs.sendRequest(tab.id, {channel: "login/app/start"});
						});
					});
				}else{
					currentWinId && chrome.tabs.create({
						windowId: currentWinId,
						index: len,
						url:'http://www.xinqianduan.com/#!login',
						selected: true,
					},function(){
							chrome.tabs.getSelected(currentWinId, function(tab) {
							  chrome.tabs.sendRequest(tab.id, {channel: "login/app/start"});
							});
					});
				}
			});
		}

		// 书签数据
		if(msg && msg.channel == 'bookmarks'){
			if(port && port.sender && port.sender.tab){
				chrome.bookmarks.getTree(function(source){
					chrome.tabs.getSelected(port.sender.tab.windowId, function(tab) {
					  chrome.tabs.sendRequest(tab.id, {channel: "bookmarks",data: source});
					});
				});
			}
		}
	});
});

// 右键分享插件
chrome.contextMenus.create({
	"title" : "收藏本页面至云端",
	"type" : "normal",
	"contexts" : ["all"],
	"onclick" : getTabInfo
});

// 分享页面
function getTabInfo(event) {
	var notification = function(title, text) {
		return webkitNotifications.createNotification('icon4.png', title, text);
	};

	chrome.windows.getCurrent(function(win) {
		chrome.tabs.getSelected(win.id, function(tab) {
			currentWinId = win.id;
			createShareWin({
				url: tab.url,
				title: tab.title
			});
			// sendDataToServer({
			// 	url:tab.url,
			// 	title:tab.title,
			// 	windowId: win.id
			// },notification.show);
		});
	});
}

// 创建分享页面
function sendDataToServer(param,callback) {
	var height = 180,
		width = 500;
	chrome.windows.getAll({populate:true},function(source){
		console.log(source);
	});
	chrome.windows.create({
		url : 'http://striblog.com/share/?'+jsonToQuery(param),
		top : parseInt((screenParam.height - height)/2)-height*0.6,
		left : (screenParam.width - width)/2,
		width : width,
		height : height,
		type :"popup"
	},callback);
}

// 创建分享win
function createShareWin(data){
	var height = 180,
		width = 500,
		param = {
		url : 'http://striblog.com/share/?'+jsonToQuery(data),
		top : parseInt((screenParam.height - height)/2)-height*0.6,
		left : (screenParam.width - width)/2,
		width : width,
		height : height,
		type :"popup"
	};

	chrome.windows.getAll({populate:true},function(source){
		var winId,
			tabId;

		source.forEach(function(win){
			var tab;
			if(win.type== 'popup' && win.tabs.length == 1 && isSharePage.test((tab = win.tabs[0]).url)){
				winId = win.id;
				tabId = tab.id
			}
		});
		// 如果没有
		if(!winId){
			chrome.windows.create(param,function(win){
				updateWinId = win.id;
			});
		}else{
			updateWinId = winId;
			chrome.windows.update(winId,{focused:true},function(tab){
				chrome.tabs.update(tabId,{
					url: param.url
				});
			});
		}
	});
}


/**
 * 工具方法
 * @param   {[type]}  json  [description]
 * @return  {[type]}        [description]
 */
function jsonToQuery(json){
	var re = [];
	
	for(var p in json){
		re.push(p+'='+encodeURIComponent(json[p]));
	}
	
	return re.join('&');
}
