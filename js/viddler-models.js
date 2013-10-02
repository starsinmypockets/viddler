(function ($) {
    window.ViddlerModel = Backbone.Model.extend({
            // no op
    });
    
    window.CommentModel = ViddlerModel.extend({
        
    });
    
    window.PlayListModel = ViddlerModel.extend({
        url : function () {
            return '../json-examples/playlists/comments2.json';
        }
    });
    
})(jQuery);