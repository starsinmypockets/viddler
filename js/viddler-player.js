var ViddlerPlayer = ViddlerPlayer || {};

window.loadViddlerComments = function (id) {
    collection = new CommentCollection([], {media_element : id});
      commentsView = new CommentView({
        collection : collection,
        tmp : '#tmp-comment',
        el : "#comments-container"
    });
    commentsView.loadComments();
}

window.loadViddlerPlaylist = function (id) {
    model = new PlayListModel([], {id : id});
    playListView = new PlayListView({
        model : model,
        tmp : '#tmp-playlist',
        el : "#playlist-container"
    });
    playListView.render();
}

rainReady(function(){

    $(document).ready(function(){  // is JQuery ready. if rain ready than it should be
    	console.log("hi");
    });

});