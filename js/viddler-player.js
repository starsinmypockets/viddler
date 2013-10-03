( function ($) {
var ViddlerPlayer = ViddlerPlayer || {};

/* Events aggregator */
ViddlerPlayer.vent = _.extend({}, Backbone.Events);


/* Basic routing / workflow delegation */

window.testInit = function () {
    playlist = new PlayListView({
        vent : ViddlerPlayer.vent        
    });
    playlist.loadPlayerGui();
    playlist.loadJPlayer();
    playlist.renderCommentMarkers();
//    playlist.render();
    $('.bar').on('click', function (e) {
        playlist.loadCommentPopUp();
    });
};

window.loadViddlerComments = function (id) {
    collection = new CommentCollection([], {media_element : id});
      commentsView = new CommentView({
        collection : collection,
        tmp : '#tmp-comment',
        el : "#comments-container",
        vent : ViddlerPlayer.vent
    });
    commentsView.loadComments();
};

window.loadViddlerPlaylist = function (id) {
    model = new PlayListModel();
    playListView = new PlayListView({
        model : model,
        tmp : '#tmp-playlist',
        el : "#playlist-container",
        vent : ViddlerPlayer.vent
    });
    playListView.loadPlayList();
};


/* Global DOM events (trigger vent) */


window.getCommentModal 

rainReady(function(){
    $(document).ready(function(){  // is JQuery ready. if rain ready than it should be
        console.log('rainReady');
    });

});    
})(jQuery);
