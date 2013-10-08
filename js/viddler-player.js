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

( function ($) {
var ViddlerPlayer = ViddlerPlayer || {};

/* Events aggregator */
ViddlerPlayer.vent = _.extend({}, Backbone.Events);

// get login view
ViddlerPlayer.vent.bind('doLogin', function () {
    login = new UserLoginView({
        tmp : '#tmp-user-login-form'
    }).render();
});

// get signup view
ViddlerPlayer.vent.bind('doSignup', function () {
    login = new UserSignupView({
        tmp : '#tmp-user-signup-form'
    }).render();
});
/* Basic routing / workflow delegation */

window.testInit = function () {
    playlist = new PlayListView({
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
    });    console.log('tesg MP');
};

rainReady(function(){
    $(document).ready(function(){  // is JQuery ready. if rain ready than it should be
        console.log('rainReady');
        $('#user-login').on('click', function () {ViddlerPlayer.vent.trigger('doLogin')});
        $('#user-signup').on('click', function () {ViddlerPlayer.vent.trigger('doSignup')});
        
        /* Session Authentication */
        var $doc = $(document);
        
        $doc.ajaxSend(function (event, xhr) {
            var authToken = $.cookie('access_token');
            if (authToken) {
                xhr.setRequestHeader("Authorization", "Bearer " + authToken);
            }
        });

        $doc.ajaxError(function (event, xhr) {
            if (xhr.status == 401)
                redirectToLogin();
        });
    });

});    
})(jQuery);
