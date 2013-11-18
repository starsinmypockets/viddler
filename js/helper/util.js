define(['exports'], function(exports) {

// Avoid `console` errors in browsers that lack a console.
  var method;
  exports.noop = function () {};
  var methods = [
      'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
      'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
      'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
      'timeStamp', 'trace', 'warn'
  ];
  var length = methods.length;
  var console = (window.console = window.console || {});

  while (length--) {
      method = methods[length];

      // Only stub undefined methods.
      if (!console[method]) {
          console[method] = exports.noop;
      }
  }

  // Output Browser [Name, Version]
  console.log((function(){
    var N= navigator.appName, ua= navigator.userAgent, tem;
    var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
    M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
    return M;
   })());


  exports.secs2time = function(seconds) {
    var hours   = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var seconds = seconds - (hours * 3600) - (minutes * 60);
    var time = "";

    (hours !== 0) ? time = hours+":" : time = hours+":";
    if (minutes != 0 || time !== "") {
      minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
    } else {
        minutes = "00:";
    }  
    time += minutes+":";
    if (seconds === 0) { 
        time+="00";
    } else {
        time += (seconds < 10) ? "0"+seconds : String(seconds);
    }
    return time;
  };

  // returns array: ["browser", "minor version"]
  exports.browser = function () {
      var N= navigator.appName, ua= navigator.userAgent, tem;
      var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
      if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
      M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
      return M;
  }();
  
  exports.matrix = function() {
    return {
        'flashBrowser': function () {
                var flash = false;
                if (exports.browser[0] === "Firefox") flash = true;
                if (exports.browser[0] === "MSIE" && exports.browser[1].indexOf(8) === 0) flash = true;
                return flash;            
            }(),
        'ios' : navigator.userAgent.match(/(iPod|iPhone|iPad)/),
        'iPhone' : navigator.userAgent.match(/(iPhone)/),
        'ie8': (exports.browser[0] === "MSIE" && exports.browser[1].indexOf(8) === 0)
      }
  }();
  
  exports.ios = function () {
      return navigator.userAgent.match(/(iPod|iPhone|iPad)/);
  }();

  // this catches ie8 and ff
  exports.ie8 = function () {
      var bad = false;
      if (exports.browser[0] === "Firefox") bad = true;
      if (exports.browser[0] === "MSIE" && exports.browser[1].indexOf(8) === 0) bad = true;
      return bad;
  }();

});
