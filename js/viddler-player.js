( function ($) {
var ViddlerPlayer = ViddlerPlayer || {};

/* Events aggregator */
ViddlerPlayer.vent = _.extend({}, Backbone.Events);


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

    $('.bar').on('click', function (e) {
        console.log('bar click');
        playlist.loadCommentPopUp();
    });    console.log('tesg MP');
};

rainReady(function(){
    $(document).ready(function(){  // is JQuery ready. if rain ready than it should be
    });

});    
})(jQuery);
