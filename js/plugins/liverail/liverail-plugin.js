// Required Config Values
// config.lr_video_id
// config.lr_title

/*  <script language="javascript" src="http://cdn-static.liverail.com/js/LiveRail.Interstitial-1.0.js?LR_PUBLISHER_ID=1331&LR_VIDEO_ID=[contentID]&LR_TITLE=[contentTitle]&LR_LAYOUT_SKIN_ID=2&spacing=10"></script> */
// This has to execute in the <head> since we're doing an inline document.write


//// LiveRail Events
// initComplete, all ads are about to start
function onLiveRailInitComplete() {
  //alert('event="initComplete"');
}

// a campaign in the preroll playlist is about to begin
function onLiveRailAdStart() {
  //alert('event="adStart"');
}

// video ad has ended
function onLiveRailAdEnd() {
  //alert('event="adEnd"');
}

// user has clicked on the video ad
function onLiveRailClickThru() {
  //alert('event="clickThru"');
}

// all ads (if any available) have completed
// proceed to main content
function onLiveRailPrerollComplete(hasPlayedAd){
  //alert('LiveRail complete. hasPlayedAd=' + hasPlayedAd);
  if(hasPlayedAd){
       // proceed to the main content
  }else{
       // daisy chain to some other ad-tag
  }
}