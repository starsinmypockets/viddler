var QueryString = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    	// If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    	// If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    	// If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

//// LiveRail Events
// initComplete, all ads are about to start
function onLiveRailInitComplete() {
  console.log('event="initComplete"');
}

// a campaign in the preroll playlist is about to begin
function onLiveRailAdStart() {
  console.log('event="adStart"');
}

// video ad has ended
function onLiveRailAdEnd() {
  console.log('event="adEnd"');
}

// user has clicked on the video ad
function onLiveRailClickThru() {
  console.log('event="clickThru"');
}

// all ads (if any available) have completed
// proceed to main content
function onLiveRailPrerollComplete(hasPlayedAd){
  console.log('LiveRail complete. hasPlayedAd=' + hasPlayedAd);
  if(hasPlayedAd){
       // proceed to the main content
  }else{
       // daisy chain to some other ad-tag
  }
}

var fileref = document.createElement('script');
fileref.src = "http://cdn-static.liverail.com/js/LiveRail.Interstitial-1.0.js?LR_PUBLISHER_ID=1331&LR_VIDEO_ID=" + QueryString.lr_video_id + "&LR_TITLE=" + QueryString.lr_title + "&LR_LAYOUT_SKIN_ID=2&spacing=10";
document.documentElement.appendChild(fileref);