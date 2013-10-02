(function ($) {
    window.ViddlerModel = Backbone.Model.extend({
            // no op
    });
    
    window.CommentModel = ViddlerModel.extend({
        
    });
    
    window.PlayListModel = ViddlerModel.extend({
        parse : function (response) {
            return response;
        },

        url : function () {
            return '../json-examples/playlists/playlistexample2.json';
        }
    });
    
})(jQuery);