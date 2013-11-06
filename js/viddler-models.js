define(['backbone'], function(Backbone) {

    var Models = {};

    Models.ViddlerModel = Backbone.Model.extend({
        parse : function (response) {
            return response;
        }   // no op
    });
    
    Models.UserModel = Models.ViddlerModel.extend({
        defaults : {
            id : ''
            
        },
        
        url : function () {
            return '../json/users/userexample.json';
        }
    });
    
    Models.CommentModel = Models.ViddlerModel.extend({
        defauls : {
            id : '',
            userId : '',
            title : '',
            commentText : '',
            avatar : '',
            mediaElement : '',
            created : '',
            playHeadPos : ''
        },
        
        validate : function () {
            
        }
    });
    
    Models.PlayListModel = Models.ViddlerModel.extend({
        defauls : {
            id : ''
        },

        url : function () {
            //return 'json-examples/playlists/needloginresponse.json';
            return 'json-examples/playlists/playlistexample2.json';
        },
        parse : function (response, options) {
            var that = this;
            console.log(response);
            if (response.gate) {
                that.gate = response.gate;
            }
            return response;
        },
        
        addComment : function (opts) {
            comment = new CommentModel({
                userId : '',
                mediaElement : '', 
                playListId : this.id,
                playHeadPos : '',
                title : '',
                created : Date()
            });
            comment.save();
        }
    });
    
    Models.UserModel = Models.ViddlerModel.extend({
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
    
    return Models;

});