(function ($) {
    var DEBUG = true;
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
        
        render : function () {
            this.$el.html(this.template());
        }
        
    });
    
    // Instantiates jPlayer, handles comments etc
    // use this.$el.jPlayer() to manipulate player instance
    window.PlayListView = BaseView.extend({
        el : '#jp_container_1',
        comments : {},
        timeline : {},
        timeLineStep : 0,
        currentTime : 0,
        jPlayer : {},
        pop : {},
        
        getMediaElementComments : function (opts) {
            console.log(opts);
            var that = this;
            var comments = {}
            commentCollection = new CommentCollection([], {media_element : opts.id});
//            comments = new CommentCollection([], {media_element : this.timeline.mediaElements[this.timeLineStep].id});
            commentCollection.fetch({
                success : function (collection, response) {
                    console.log("got comments success");
                     comments = collection.toJSON();
                     that.loadComments({comments : comments});
                     that.renderCommentMarkers({comments : comments, jqEl : opts.jqEl});
                },
                error : function (collection, response) {
                    console.log("got comments fail");
                    return {};
                }  
            });
            return comments;
        },
        
        // return all comments for playlist
        getPlayListComments : function (id) {
            
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
             this.playTimeLine();
        },
        
        onModelReady : function () {
            if (DEBUG) console.log('Model Ready Event');
            this.loadPlayerGui();
            if (DEBUG) console.log(this.model);
            this.loadJPlayer();
            error = new ErrorMsgView({
                errorType : "generic",
                errorMsg : "Testing error broadcasting system"
            }).set();
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
                    that.loadPlayerGui();
                    that.loadJPlayer();
                    error = new ErrorMsgView({
                        errorType : "server",
                        errorMsg : "Error retrieving playlist data from server"
                    }).set();
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
                    $('#inspector').jPlayerInspector({
                        jPlayer : $("#jquery_jplayer_1")
                    });                    
                },
                swfPath: "../skin/js`",
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
        
        loadMegaTimeLine : function (opts) {
            var that = this;
            var data = {};
            var comments = [];
            data.elems = opts.mediaElements;
            console.log(comments);
            console.log(this.model.id);
            $('#mega-container').html(_.template($('#tmp-mega-timeline').html(), data));
            this.getMediaElementComments({id : this.model.id, jqEl : "#mega-markers-container"});
            
        },
        
        playTimeLine : function (opts) {
            var that = this;
            var status = that.$el.jPlayer().data().jPlayer.status;
            var mediaElements = this.timeline.mediaElements;
            var steps = mediaElements.length;
            var stepMedia = mediaElements[this.timeLineStep];
            var progressCounterIntv;
            var timeLineComplete = 0; // length in ms of completed steps
            var timeLineLength = 0; // total length in ms of timeline
            var timeLineCurrent = 0;
            var jp = $(that.$el.jPlayer());
            var jpe = $.jPlayer.event;
            var tDEBUG = false;
            
            _.each(mediaElements, function (el) {
                el.length = el.playheadStop - el.playheadStart;
                timeLineLength += el.length;
            });
            
            // initialize timeline
            if (this.timeLineStep === 0) {
                // add some conf check here
                this.loadMegaTimeLine({
                    mediaElements : mediaElements,
                    steps : steps,
                    timeLineLength : timeLineLength
                });
                $(that.$el.jPlayer()).bind($.jPlayer.event.ended, _.bind(doNext, that));
            }
            
            if (stepMedia) {
                var data = {};
                data[stepMedia.elementType] = stepMedia.elementURL;
                data.subtitleSrc = stepMedia['subtitle-source'];
              //  data['poster'] = stepMedia.poster;
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
                    if (data.subtitleSrc) {
                        // clear old popcorn events
                        if (that.pop.hasOwnProperty('destroy')) {
                            that.pop.destroy();
                        }
                        // add subtitles
                        that.pop = Popcorn("#jp_video_0");
                        that.pop.parseSRT(data.subtitleSrc);
                    }
                    
                    if (tDEBUG) console.log('canPlay');
                    playerData = that.$el.jPlayer().data('jPlayer').status;
                    duration = Math.floor(playerData.duration*1000); // convert to ms
                    that.$el.jPlayer("play", start/1000);                    
                    //console.log(timeLineComplete);
                    if (this.timeLineStep === 0) {
                        // start timeline pause
                        that.$el.jPlayer('pause');
                    }
                    window.timeLinePercent = 75;

                    updateCompletedTime();
                    updateCurrentTime();
                    
                    if (stop) {
                        runStopListener(stop);
                    };
                    console.log(stepMedia);
                    stepComments = that.getMediaElementComments({id : stepMedia.id, jqEl : "#markers-container"});
                    console.log(stepComments);
                    // unbind canplay
                    $(that.$el.jPlayer()).unbind($.jPlayer.event.canplay);
                }, that));
            };
            
            // get total ms elapsed in previous steps
            function updateCompletedTime() {
                if (that.timeLineStep > 0) {
                    for (var i = 0; i < that.timeLineStep; i++) {
                        timeLineComplete += parseInt(mediaElements[i].length);
                    }
                }
            };
            
            function updateCurrentTime() {
                var win = window
                var updateIntv = setInterval(function() {
                   timeLineCurrent = parseInt((that.$el.jPlayer().data().jPlayer.status.currentTime*1000) - stepMedia.playheadStart + timeLineComplete, 10);// + timeLineComplete);
                    if ((that.$el.jPlayer().data().jPlayer.status.currentTime*1000)-stepMedia.playheadStart >= stepMedia.length) {
                        clearInterval(updateIntv);
                    };
                    if (tDEBUG) {
                        console.log('current: '+timeLineCurrent);
                        console.log('total: '+timeLineLength);
                        console.log('%: '+ timeLineLength / timeLineCurrent);
                    }
                },1000);
            };
            function runStopListener(stop) {
                var stopIntv = setInterval(function() {
                   if (that.$el.jPlayer().data().jPlayer.status.currentTime > stop/1000) {
                      if (tDEBUG) console.log('stop listener stop');
                      clearInterval(stopIntv);
                      $(that.$el.jPlayer()).trigger($.jPlayer.event.ended);
                   }
                },100);  
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
                      if (tDEBUG) console.log('stop listener stop');
                      clearInterval(intvId);
                      $(that.$el.jPlayer()).trigger($.jPlayer.event.ended);
                   }
                },100);  
            };
            
            function timeLineDone() {
                if (tDEBUG) console.log('finished');
                that.$el.jPlayer("pause");
                // reclass play button to restart timeline
                return;
            };
            
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
        
        // figer out how many comment markers fit on a timeline
        calcCommentMarkers : function (opts) {
            var that=this;
            var playerData = this.$el.jPlayer().data('jPlayer').status;
            var markerArray, numbMarkers, markerSecs;
            
            if (opts && opts.mega === true) {
                numbMarkers = Math.floor($('.mega-timeline .jp-progress').width() / 20); // [width of bar] / [ width of marker+4px ]
                markerSecs = Math.floor(opts.timeLineLength) / numbMarkers; // [ length of video ] / [ number of Markers ]
            } else {
                numbMarkers = Math.floor($('.jp-progress').width() / 20); // [width of bar] / [ width of marker+4px ]
                markerSecs = Math.floor(playerData.duration) / numbMarkers; // [ length of video ] / [ number of Markers ]
            }
            
            // build array of marker-points with start / stop attrs
            markerArray = []; 

            function funcs(markerArray, i) {
                markerArray[i] = {};
                markerArray[i].start = parseInt(i*markerSecs);
                markerArray[i].stop = parseInt(markerArray[i].start + markerSecs);
            }
            
            for (var i = 0; i < numbMarkers; i++) {
                funcs(markerArray, i);
            }
            return { markerArray : markerArray, numbMarkers : numbMarkers};
        },
        
        // Make sure media is loaded before calling
        // or player values will be empty
        renderCommentMarkers : function (opts) {
            console.log(opts);
            var that = this;
            var markerArray = this.calcCommentMarkers(opts).markerArray;
            var numbMarkers = this.calcCommentMarkers(opts).numbMarkers;
            var comments = opts.comments;
            console.log(opts);
            // now build array of populated marker positions for rendering
            markers = [];
            var j = 0;
            var pos = 1;
            
            _.each(markerArray, function(spot) {
                _.each(comments, function (comment) {
                    if (comment.time >= spot.start && comment.time <= spot.stop) {
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
            if (DEBUG) console.log(data);
            $(opts.jqEl).html(_.template($('#tmp-comment-markers').html(), data));                
            // render proper context here
        },
        
        
        loadComments : function (opts) {
            data = {};
            data.items = opts.comments;
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
    
    // Render Errors    
    ErrorMsgView = BaseView.extend({
        errorType : '',
        errorMsg : '',
        el : '#error-message-container',
        
        initialize : function (opts) {
            this.errorType = opts.errorType;
            this.errorMsg = opts.errorMsg;
            this.__init(opts);
        },
        
        set : function () {
            data = {};
            data.type = this.errorType;
            data.msg = this.errorMsg;
            this.$el.html(_.template($('#tmp-error-msg').html(), data));
        }
    });
    
    UserLoginView = BaseView.extend({
        el : '#user-login-container',
        
        events : {
            'click #user-login-submit' : 'doLogin'
        },
        
        doLogin : function () {
            alert('login!');
            // do api login call here
            this.$el.empty();
        }
    });
    
    UserSignupView = UserLoginView.extend({
       events : {
            'click #user-signup-submit' : 'doSignup'
        },
        
        doSignup : function () {
            alert('signup');
            // do api signup here
            this.$el.empty();
        }
        
    });
    
    PopcornPlayListView = PlayListView.extend({
        loadPopcornPlayer : function (opts) {
            this.setElement('#jquery_jplayer_1');
            var that = this;
            this.$el.jPlayer({
                ready: function () {
                    // bind events once player is ready
                    that.onPlayerReady();
                },
                swfPath: "../skin/js`",
                supplied: "m4v, ogv",
                errorAlerts : true
            });
        },
    });
    
})(jQuery);