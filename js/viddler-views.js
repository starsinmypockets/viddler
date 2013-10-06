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
        el : '#jp_container_1',
        comments : {},
        timeline : {},
        timeLineStep : 0,
        
        getMediaElementComments : function () {
            var that = this;
            comments = new CommentCollection([], {media_element : this.timeline.mediaElements[this.timeLineStep].id});
            comments.fetch({
                success : function (collection, response) {
                     console.log(collection);
                     that.comments = collection;
                     that.loadComments();
                     that.renderCommentMarkers();
                },
                error : function (collection, response) {
                    collection = {};
                    collection.comments = [];
                    that.loadComments();
                    that.renderCommentMarkers();
                }  
            });
            return this;
        }, 

        events : {
            'click #comment-form-submit' : 'commentSubmit',
        },
        
        initialize : function (opts) {
            this.__init(opts);
            _.bindAll(this, 'commentSubmit');
        },
        
        onPlayerReady : function () {
            console.log('Player Ready Event');
            // this.playTimeLine();
        },
        
        onModelReady : function () {
            console.log('Model Ready Event');
            var that = this;
            this.loadPlayerGui();
            this.loadJPlayer();
            this.playTimeLine();
        },
                
        loadPlayList : function (opts) {
            var that = this;
            this.model.fetch({
                success : function (model, response, opts) {
                    that.timeline = model.get('timeline');
                    that.timeLineSteps = that.timeline.mediaElements.length;
                    that.onModelReady();
                    that.render();
                },
                // @@ TODO proper error rendering
                error : function (model, response) {
                    alert('error loading playlist model');
                }
            });
        },
        
        // instantiate jPlayer
        loadJPlayer : function (opts) {
            this.setElement('#jquery_jplayer_1');
            var that = this;
            this.$el.jPlayer({
                ready: function () {
                    // bind events once player is ready
                    that.onPlayerReady();
                },
                swfPath: "/js",
                supplied: "m4v, ogv",
                errorAlerts : true
            });
        },
        
        // Get the controls
        loadPlayerGui : function (opts) {
            var that = this;
            this.setElement('.jp-gui');
            this.$el.html(_.template($('#tmp-jplayer-gui').html()));
            this.$('.jp-comment').on('click', function () {
                that.loadCommentPopUp();
            });
        },
        
        playTimeLine : function () {
            var that = this;
            var mediaElements = this.timeline.mediaElements;
            var steps = mediaElements.length;
            var stepMedia = mediaElements[this.timeLineStep];

            // bind player events on first time through
            if (this.timeLineStep === 0) {
                $(that.$el.jPlayer()).bind($.jPlayer.event.ended, _.bind(doNext, that));
            }
            
            if (stepMedia) {
                console.log(stepMedia);
                data = {};
                data[stepMedia.elementType] = stepMedia.elementURL;
                data['poster'] = stepMedia.poster;
                if (this.timeLineStep < steps) {
                    doTimeLineStep(data, stepMedia.playheadStart, stepMedia.playheadStop);                                
                }
            } else {
                timeLineDone();
            }
            
            function doTimeLineStep(data, start, stop) {
                var playerData, duration;
                that.$el.jPlayer("setMedia", data);
                // wait for media to load
                $(that.$el.jPlayer()).bind($.jPlayer.event.canplay, _.bind(function (event) {
                    console.log('canPlay');
                    playerData = that.$el.jPlayer().data('jPlayer').status;
                    duration = Math.floor(playerData.duration*1000); // convert to ms
                    that.$el.jPlayer("play", start/1000);                    
                    if (stop) {
                        runStopListener(stop);
                    };
                    that.getMediaElementComments();
                    // unbind canplay
                    $(that.$el.jPlayer()).unbind($.jPlayer.event.canplay);
                }, that));
            };
            
            
            // trigger this on 'ended' event OR if we reach playheadStop
            function doNext() {
                that.timeLineStep++;
                that.playTimeLine();
            };
            
            // listen for stop
            function runStopListener(stop) {
                var intvId = setInterval(function() {
                   if (that.$el.jPlayer().data().jPlayer.status.currentTime > stop/1000) {
                      console.log('stop listener stop');
                      clearInterval(intvId);
                      $(that.$el.jPlayer()).trigger($.jPlayer.event.ended);
                   }
                },100);  
            };
            
            function timeLineDone() {
                console.log('finished');
                that.$el.jPlayer("setMedia", {});
                // reclass play button to restart timeline
                $('.jp-play').addClass('init-timeline');
                return;
            };
            
        },
               
        timeLineFinished : function () {
            clearInterval(this.pollId);
            console.log('Time Line Finished');
        },
        
        // If attr is passed, return attr value, else return status obj
        getPlayerStatus : function (attr) {
            var status = this.$el.jPlayer.data();
            return status;
        },
        
        loadCommentPopUp : function (data) {
            data = {};
            playerData = this.$el.jPlayer().data().jPlayer.status;
            data.time = Math.floor(playerData.currentTime);
            data.avatar = "http://placekitten.com/75/75";
            $('#comment-popup-container').html(_.template($('#tmp-comment-popup').html(), data));
            $('#comment-form-submit').on('click', this.commentSubmit);
        },
        
        // create comment popup form and submit it
        commentSubmit : function (e) {
            e.preventDefault();
            comment = new CommentModel({
                avatar : 'http://placekitten.com',
                mediaElement : '###',
                created : Date(),
                title : $('.comment-form input[name=title]').val(),
                commentText : $('.comment-form input[name=commentText]').val(),
                playHeadPos : $('#comment-play-head-pos').val()
            });
            data = {};
            // @@ Do save here
            console.log(comment);
            $('#comment-popup-container').empty();
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
    
    MgPlayListView = PlayListView.extend({
        loadMgPlaylist: function () {
            
        }
    });
    
})(jQuery);