(function ($) {
    /* Abstract */
    window.BaseView = Backbone.View.extend({
        id : 'content',
        tag : 'div',
        el : '<br/>',
        vent : {},
        
        __init : function (opts) {
            this.vent = opts.vent; 
            if (opts.tmp) {
                this.template = _.template($(opts.tmp).html());            
            };
        },
        
        initialize : function (opts) {
            this.__init(opts);
        },
        
    });
    
    // Instantiates jPlayer, handles comments etc
    // use this.$el.jPlayer() to manipulate player instance
    window.PlayListView = BaseView.extend({
        el : '#jquery_jplayer_1',
        events : {
            'click #comment-form-submit' : 'commentSubmit'
        },
        
        initialize : function (opts) {
            this.__init(opts);
            _.bindAll(this, 'commentSubmit');
        },
        
        // this is bound on canplay event 
        // after player is loaded
        onMediaReady : function () {
            console.log('DATA LODED');
            this.renderCommentMarkers();
            return this;
        },
        
        loadPlayList : function (opts) {
            var that = this;
            this.model.fetch({
                success : function (model, response, opts) {
                    that.render();
                },
                error : function (model, response) {
                    console.log(response);
                }
            });
        },
        
        // instantiate jPlayer
        loadJPlayer : function (opts) {
            var that = this;
            this.$el.jPlayer({
                ready: function () {
                    that.$el.jPlayer("setMedia", {
                        m4v: "http://www.jplayer.org/video/m4v/Big_Buck_Bunny_Trailer_480x270_h264aac.m4v",
                        ogv: "http://www.jplayer.org/video/ogv/Big_Buck_Bunny_Trailer_480x270.ogv",
                        poster: "http://www.jplayer.org/video/poster/Big_Buck_Bunny_Trailer_480x270.png"
                    });
                    // bind events once player is ready
                    $(that.$el.jPlayer()).bind($.jPlayer.event.canplay, _.bind(that.onMediaReady, that));
                },
                swfPath: "/js",
                supplied: "m4v, ogv"                
            });
        },
        
        loadPlayerGui : function (opts) {
            $('.jp-gui').html(_.template($('#tmp-jplayer-gui').html()));
        },
        
        // If attr is passed, return attr value, else return status obj
        getPlayerStatus : function (attr) {
            var status = this.$el.jPlayer.data();
            return status;
        },
        
        loadCommentPopUp : function (data) {
            var that = this;
            this.$el.jPlayer("pause");

            data = {};
            playerData = this.$el.jPlayer().data().jPlayer.status;
            data.time = playerData.currentTime;
            data.avatar = "http://placekitten.com/75/75";
            console.log(playerData);
            console.log(data)
            $('#comment-popup-container').html(_.template($('#tmp-comment-popup').html(), data));
            this.delegateEvents();
        },
        
        // create comment popup form and submit it
        commentSubmit : function (e) {
            e.preventDefault();
            console.log('foop');
            this.$el.jPlayer("pause");
            comment = new CommentModel({
                avatar : 'http://placekitten.com',
                mediaElement : '###',
                created : Date(),
                title : $('.comment-form input[name=title]').val(),
                commentText : $('.comment-form input[name=commentText]').val(),
                playHeadPos : $('#comment-play-head-pos').val()
            });
            console.log(comment);
            data = {};
            
        },
        
        // Make sure media is loaded before calling
        // or player values will be empty
        renderCommentMarkers : function () {
            playerData = this.$el.jPlayer().data('jPlayer').status;
            console.log(playerData);

            // [width of bar] / [ width of marker+4px ]
            var numbMarkers = Math.floor($('.jp-progress').width() / 20);
            // [ length of video ] / [ number of Markers ]
            var markerSecs = Math.floor(playerData.duration) / numbMarkers;
            console.log(playerData['duration']);
            console.log($('.jp-progress').width());
            console.log(numbMarkers);
            console.log(markerSecs);
        },
        
        render : function () {
            this.delegateEvents();
        }
    });

    
    window.CommentView = BaseView.extend({  
        initialize : function (opts) {
            this.__init(opts);
            console.log(this.collection);
        },
        
        loadComments : function (opts) {
            var that = this;
            this.collection.fetch({
                success : function (collection, response) {
                     that.collection = collection;
                     that.render();
                },
                error : function (collection, response) {
                    that.render({error : true});
                }  
            });
        },
        
        render : function (opts) {
            data = {};
            data.items = this.collection.toJSON();
            // If error, just load view with no comments
            if (opts && opts.error === true) {
                data.error = true;
                data.items = [];
            }
            this.$el.html(this.template(data));
            return this;
        }
    });
})(jQuery);