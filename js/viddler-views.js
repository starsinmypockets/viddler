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
        comments : {},
        timeline : {},
        timeLineStep : 0,
        
        getMediaElementComments : function () {
            console.log('hit this');
            var that = this;
            comments = new CommentCollection([], {media_element : that.timeline.mediaElements[that.timeLineStep].id});
            comments.fetch({
                success : function (collection, response) {
                     console.log(collection);
                     that.comments = collection;
                     that.loadComments();
                     that.renderCommentMarkers();
                },
                error : function (collection, response) {
                    alert('Error loading playlist comments');
                }  
            });
            return this;
        }, 

        events : {
            'click #comment-form-submit' : 'commentSubmit'
        },
        
        initialize : function (opts) {
            this.__init(opts);
            _.bindAll(this, 'commentSubmit');
        },
        
        onPlayerReady : function () {
            console.log('Player Ready Event');
            return this;
        },
        
        onModelReady : function () {
            console.log('Model Ready Event');
            this.loadPlayerGui();
            this.loadJPlayer();
        },
                
        loadPlayList : function (opts) {
            var that = this;
            this.model.fetch({
                success : function (model, response, opts) {
                    that.timeline = model.get('timeline');
                    that.onModelReady();
                    that.render();
                },
                error : function (model, response) {
                    alert('error loading playlist model');
                }
            });
        },
        
        // instantiate jPlayer
        loadJPlayer : function (opts) {
            var that = this;
            this.$el.jPlayer({
                ready: function () {
                    // bind events once player is ready
                    that.playTimeLine();

                    $(that.$el.jPlayer()).bind($.jPlayer.event.canplay, _.bind(that.onPlayerReady, that));
/*
                    that.$el.jPlayer("setMedia", {
                        m4v: "http://www.jplayer.org/video/m4v/Big_Buck_Bunny_Trailer_480x270_h264aac.m4v",
                        ogv: "http://www.jplayer.org/video/ogv/Big_Buck_Bunny_Trailer_480x270.ogv",
                        poster: "http://www.jplayer.org/video/poster/Big_Buck_Bunny_Trailer_480x270.png"
                    });
*/
                },
                swfPath: "/js",
                supplied: "m4v, ogv"                
            });
        },
        
        // Get the controls
        loadPlayerGui : function (opts) {
            $('.jp-gui').html(_.template($('#tmp-jplayer-gui').html()));
        },
        
        // cue and play media elements
        playTimeLine : function () {
            var that = this;
            mediaElement = this.timeline.mediaElements[this.timeLineStep];
            console.log('Timeline step :'+this.timeLineStep);
            console.log(mediaElement);
            data = {};
            data[mediaElement.elementType] = mediaElement.elementURL;
            data['poster'] = mediaElement.poster;
            console.log(data);
            this.$el.jPlayer("setMedia", data);
            
            // when the media's ready
            $(this.$el.jPlayer()).bind($.jPlayer.event.canplay, _.bind(function () {
                console.log('Timeline video ready');
                that.getMediaElementComments();
                if (that.timeLineStep > 0) {
                    that.$el.jPlayer("play");
                };                
            }, this));
            
            // bind video end event
            $(this.$el.jPlayer()).bind($.jPlayer.event.ended, _.bind(function () {
                console.log('ended event triggered');
                that.timeLineStep++;
                that.playTimeLine();
            }, this));
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
            this.$el.jPlayer("pause");
            comment = new CommentModel({
                avatar : 'http://placekitten.com',
                mediaElement : '###',
                created : Date(),
                title : $('.comment-form input[name=title]').val(),
                commentText : $('.comment-form input[name=commentText]').val(),
                playHeadPos : $('#comment-play-head-pos').val()
            });
            data = {};
            
        },
        
        // Make sure media is loaded before calling
        // or player values will be empty
        renderCommentMarkers : function () {
            var that=this;
            var playerData = this.$el.jPlayer().data('jPlayer').status;
            console.log(playerData);

            // [width of bar] / [ width of marker+4px ]
            var numbMarkers = Math.floor($('.jp-progress').width() / 20);
            // [ length of video ] / [ number of Markers ]
            var markerSecs = Math.floor(playerData.duration) / numbMarkers;
            
            console.log(playerData.duration);
            console.log($('.jp-progress').width());
            console.log('number markers '+numbMarkers);
            console.log('marker secs '+markerSecs);
            
            // build array of marker-points with start / stop attrs
            var markerArray = [];
            function funcs(markerArray, i) {
                markerArray[i] = {};
                markerArray[i].start = parseInt(i*markerSecs);
                markerArray[i].stop = parseInt(markerArray[i].start + markerSecs);
            }
            for (var i = 0; i < numbMarkers; i++) {
                funcs(markerArray, i);
            }
            
            // now build array of populated marker positions for rendering
            markers = [];
            var j = 0;
            var pos = 1;
            _.each(markerArray, function(spot) {
                _.each(that.comments.models, function (comment) {
                    if (comment.attributes.time >= spot.start && comment.attributes.time <= spot.stop) {
                        markers[j] = {};
                        markers[j].start = spot.start;
                        markers[j].stop = spot.stop;
                        markers[j].pos = pos;
                        markers[j].left = (100/numbMarkers)*pos; // express the left value as a percent
                        j++;
                    }
                });
                pos++; // keep track of which position we're in
            });

            // now render this nonsense 
            data = {};
            data.markers = markers;
            console.log(data);
            $('#markers-container').html(_.template($('#tmp-comment-markers').html(), data));
        },
        
        loadComments : function (opts) {
            data = {};
            data.items = this.comments.toJSON();
            // If error, just load view with no comments
            if (opts && opts.error === true) {
                data.error = true;
                data.items = [];
            }
            $('#comments-container').html(_.template($('#tmp-comments').html(), data));
            return this;
        },
        
        render : function () {
            this.delegateEvents();
        }
    });
})(jQuery);