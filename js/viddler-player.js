// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
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
            console[method] = noop;
        }
    }
}());

// manage global timeline events
window.vplm = window.vplm || {
        tlStep : 0,
        tlSteps :0,
        tlLength : 0,
        tlElapsed : 0,
        tlNow : 0,
        timeline : {},
        stepMedia : {},
        tlComments : {},
        
        destroy : function () {
            this.tlStep = 0;
            this.tlSteps = 0;
            this.tlLength = 0;
            this.tlElapsed = 0;
            this.tlNow = 0;
            this.timeline = {};
            this.stepMedia = {};
            this.tlComments = {};
        },
        
        // reinitialize timeline
        tlReset : function () {
            this.tlStep = 0;
            this.tlElapsed = 0;
            this.tlNow = 0;
        } 
    };        
    
var ViddlerPlayer = ViddlerPlayer || {};

( function ($) {

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

// returns array: ["browser", "minor version"]
ViddlerPlayer.browser = function () {
    var N= navigator.appName, ua= navigator.userAgent, tem;
    var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
    M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
    return M;
}();

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
    test = new PlaylistView({
        model : new PlayListModel({
            id : 2342213,
        }),
        vent : ViddlerPlayer.vent
    });
    test.loadPlayList();
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

})(jQuery);

$(document).ready(function () {
    console.log('doc ready');

    $(window).on('resize', function () {
        var height = $('#jp_container_1').width()*.58;
        $('#jquery_jplayer_1').css({
            'min-height' : height
        });
    }).resize();
});