(function ($) {
    window.ViddlerModel = Backbone.Model.extend({
        parse : function (response) {
            return response;
        }   // no op
    });
    
    window.UserModel = ViddlerModel.extend({
        defaults : {
            id : ''
            
        },
        
        url : function () {
            return '../json/users/userexample.json';
        }
    });
    
    window.CommentModel = ViddlerModel.extend({
        defauls : {
            id : '',
            userId : '',
            title : '',
            commentText : '',
            avatar : '',
            mediaElement : '',
            created : '',
            playHeadPos : '',
        },
        
        validate : function () {
            
        }
    });
    
    window.PlayListModel = ViddlerModel.extend({
        defauls : {
            id : '',
            
        },

        url : function () {
            return '../json-examples/playlists/playlistexample2.json';
        },
        
        addComment : function (opts) {
            comment = new CommentModel({
                userId : '',
                mediaElement : '', 
                playHeadPos : '',
                title : '',
                created : Date()
            });
            comment.save();
        }
    });
    
    window.UserModel = ViddlerModel.extend({
        defaults : {
            userName : '',
            email : '',
            password : ''
        },
        
        login : function (username, password) {
            // do api call to get session cookie
            
            // for dev:
            return true;
        }
    });
    
})(jQuery);