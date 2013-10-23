// Required Config Values
// config.lr_video_id
// config.lr_title

/*  <script language="javascript" src="http://cdn-static.liverail.com/js/LiveRail.Interstitial-1.0.js?LR_PUBLISHER_ID=1331&LR_VIDEO_ID=[contentID]&LR_TITLE=[contentTitle]&LR_LAYOUT_SKIN_ID=2&spacing=10"></script> */
// This has to execute in the <head> since we're doing an inline document.write

window.testLiveRail = function () {
  
  // create iframe with query params: lr_video_id, lr_title
  var iframeUrl = "../js/plugins/liverail/liverail-iframe.html?lr_video_id=" + App.Config.lr_video_id + "&lr_title=" + App.Config.lr_title;
  $('<iframe />', { 
    name: 'liverail',
    id: 'liverail-iframe',
    src: iframeUrl
  }).appendTo('body');

};

console.log( "[Plugin] Loaded: LiveRail");