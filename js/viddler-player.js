//ie console for dev
 var alertFallback = true;
   if (typeof console === "undefined" || typeof console.log === "undefined") {
     console = {};
     if (alertFallback) {
         console.log = function(msg) {
              // alert(msg);
         };
     } else {
         console.log = function() {};
     }
   }
   
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
function getInternetExplorerVersion() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
        rv = parseFloat( RegExp.$1 );
    }
    return rv;
}
ie8 = (getInternetExplorerVersion() === 8);

    
window.vplm = window.vplm || 
    {
        tlStep : 0,
        tlSteps :0,
        tlLength : 0,
        tlElapsed : 0,
        tlNow : 0,
        timeline : {},
        stepMedia : {},
        tlComments : {}
    };        

( function ($) {
var ViddlerPlayer = ViddlerPlayer || {};

/* Events aggregator */
ViddlerPlayer.vent = _.extend({}, Backbone.Events);

/**
 *  Manage timeline actions
 **/
 
// continue to next timeline step
// @@ we need to access or reset the player instance (pass in)
ViddlerPlayer.vent.bind('doNextStep', function (opts) {
    var el = window.vplm.timeline.mediaElements[window.vplm.tlStep],
        vP = opts.vP,
        data = {};
    window.vplm.tlElapsed += timeline
    window.vplm.tlStep += 1;
    window.vplm.elapsed += el.playheadStop - el.playheadStart;
    // access or reset player instance
    vP.pause();
    data[el.elementType] = el.elementURL;
    vP.setElement(data);
    vP.play(el.playheadStart);
});

// get the tl step, start pos and let 'er rip
ViddlerPlayer.vent.bind('timeLineSeek', function (opts) {
    var vP = opts.vP,
        i,
        currentEl = {},
        data = {};
    window.vplm.tlStep = opts.step;
    // update timeline's elapsed time
    window.vplm.tlElapsed = 0;
    for (i = 0; i < window.vplm.tlStep; i++) {
        function func (i) {
            var el = window.vplm.timeline.mediaElements[i];
            window.vplm.tlElapsed += el.playheadStop - el.playheadStart;
        }
        func(i);
    }
    currentEl = window.vplm.timeline.mediaElements[opts.step];
    data[currentEl.elementType] = currentEl.elementURL;
    vP.play(data, currentEl.playheadStart);
});

ViddlerPlayer.vent.bind('timeLineDone', function (opts) {
    // set buttons to trigger vent.restartTimeline 
});

ViddlerPlayer.vent.bind('restartTimeline', function (opts) {
    // start it over
});

// get login view
ViddlerPlayer.vent.bind('doLogin', function () {
    login = new UserLoginView({
        tmp : '#tmp-user-login-form'
    }).render();
});

// do mega timeline seek
ViddlerPlayer.vent.bind('click .jp-seek-bar', function (e) {
    console.log('my seek');
});

// get signup view
ViddlerPlayer.vent.bind('doSignup', function () {
    console.log('triggered signup');
    login = new UserSignupView({
        tmp : '#tmp-user-signup-form'
    }).render();
});

// Unauthorized view
ViddlerPlayer.vent.bind('noAuth', function () {
    login = new UserNoAuthView({
        tmp : "#tmp-no-auth-form"
    }).render();
});
/* Basic routing / workflow delegation */

window.testInit = function () {
    playlist = new PlayListView({
        model : new PlayListModel({id : 2342213}),
        vent : ViddlerPlayer.vent
    });
    playlist.loadPlayList();
}

window.testPlayer = function () {
    test = new TestPlayerView();
    test.render();
}

window.testPlayer2 = function () {
    test = new TestPlayer2View({
        model : new PlayListModel({id : 2342213}),
    });
    test.render();
}

window.testInitPopcorn = function () {
    playlist = new PopcornPlayListView({
        model : new PlayListModel({id : 2342213}),
        vent : ViddlerPlayer.vent
    });
    playlist.loadPlayList();
};

window.testMPInit = function () {
    playlist = new MgPlayListView({
        model : new PlayListModel({id : 2342213}),
        vent : ViddlerPlayer.vent
    });
    playlist.loadPlayList();

    $('.bar').on('click ', function (e) {
        console.log('bar click');
        playlist.loadCommentPopUp();
    });   
};

rainReady(function(){
    $(document).ready(function(){  // is JQuery ready. if rain ready than it should be
        console.log('rainReady');
        $('.user-login').on('click', function () {ViddlerPlayer.vent.trigger('doLogin')});
        $('.user-signup').on('click', function () {ViddlerPlayer.vent.trigger('doSignup')});
        $('.no').on('click', function () {ViddlerPlayer.vent.trigger('noAuth')});
       /* Session Authentication */
        var $doc = $(document);
        
/*
        $doc.ajaxSend(function (event, xhr) {
            var authToken = $.cookie('access_token');
            if (authToken) {
                xhr.setRequestHeader("Authorization", "Bearer " + authToken);
            }
        });
*/

        $doc.ajaxError(function (event, xhr) {
            if (xhr.status == 401)
                ViddlerPlayer.vent.trigger('noAuth');
        });
    });
});
})(jQuery);
