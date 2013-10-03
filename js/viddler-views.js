(function ($) {
    /* Abstract */
    window.BaseView = Backbone.View.extend({
        id : 'content',
        tag : 'div',
        el : '<br/>',
        vent : {},
        
        // define global events here
        
        test : function () {
            this.vent.trigger('test');  
        },
        
        __init : function (opts) {
            _.bindAll(this, 'test');
            this.vent = opts.vent; 
            if (opts.tmp) {
                this.template = _.template($(opts.tmp).html());            
            };
        },
        
        initialize : function (opts) {
            this.__init(opts);
        },
        
    });
    
    window.PlayListView = BaseView.extend({
        jPlayer : '',
        el : '#jquery_jplayer_1',
                
        events : {
            'click' : 'addComment'
        },
        
        initialize : function (opts) {
            this.__init(opts);
            _.bindAll(this, 'addComment');
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
                    // create handle so the view can interact with the player
                    that.jPlayer = that.$el.jPlayer();
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
        
        addComment : function (e) {
            console.log('foo');
        },
        
        render : function () {
            this.delegateEvents();
        },
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