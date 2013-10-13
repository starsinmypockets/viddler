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
            var that = this,
                comments = {};
                console.log(opts);
                
            commentCollection = new CommentCollection([], {media_element : opts.id});
            commentCollection.fetch({
                success : function (collection, response) {
                     comments = collection.toJSON();
                                 console.log(comments);

                     that.loadComments({comments : comments});
                     that.renderCommentMarkers({comments : comments, jqEl : opts.jqEl});
                    return comments;
                },
                error : function (collection, response) {
                    if (DEBUG) console.log("Error loading comments");
                    return {};
                }  
            });
        },
        
        events : {
            'click #comment-form-submit' : 'commentSubmit',
        },
        
        initialize : function (opts) {
            this.__init(opts);
            _.bindAll(this, 'commentSubmit');
        },
        
        onPlayerReady : function () {
            if (DEBUG) console.log('Player Ready Handler');
            this.playTimeLine();
        },
        
        onModelReady : function () {
            if (DEBUG) {
                console.log('Model Ready Handler');
                console.log(this.model);
                error = new ErrorMsgView({
                    errorType : "generic",
                    errorMsg : "Testing error broadcasting system"
                }).set();
            }
            this.loadPlayerGui();
            this.loadJPlayer();
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
            var that = this;
            this.setElement('#jquery_jplayer_1');
            this.$el.jPlayer({
                ready: function () {
                    // bind events once player is ready
                    that.onPlayerReady();
                    if (DEBUG) {
                        $('#inspector').jPlayerInspector({
                            jPlayer : $("#jquery_jplayer_1")
                        });
                    }
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
        
        playTimeLine : function (opts) {
            var progressCounterIntv,
                that = this,
                status = that.$el.jPlayer().data().jPlayer.status,
                mediaElements = this.timeline.mediaElements,
                steps = mediaElements.length;
                stepMedia = mediaElements[this.timeLineStep],
                timeLineComplete = 0, // length in ms of completed steps
                timeLineLength = 0, // total length in ms of timeline
                timeLineCurrent = 0,
                jp = $(that.$el.jPlayer()),
                jpe = $.jPlayer.event,
                tDEBUG = false;
            
            _.each(mediaElements, function (el) {
                el.length = el.playheadStop - el.playheadStart;
                timeLineLength += el.length;
            });
            
            // initialize timeline
            if (this.timeLineStep === 0) {
                // add some conf check here
                
/*
                this.loadMegaTimeLine({
                    mediaElements : mediaElements,
                    steps : steps,
                    timeLineLength : timeLineLength
                });
*/
                
                $(that.$el.jPlayer()).bind($.jPlayer.event.ended, _.bind(doNext, that));
            }
            
            if (stepMedia) {
                var data = {};
                data[stepMedia.elementType] = stepMedia.elementURL;
                data.subtitleSrc = stepMedia['subtitle-source'];
                // data['poster'] = stepMedia.poster;
                if (this.timeLineStep < steps) {
                    doTimeLineStep(data, stepMedia.playheadStart, stepMedia.playheadStop);                                
                }
            } else {
                timeLineDone();
            }
            
            function doTimeLineStep(data, start, stop) {
                var playerData, 
                    duration,
                    subtitles = true; 
                    
                that.$el.jPlayer("setMedia", data);
                
                // wait for media to load
                $(that.$el.jPlayer()).bind($.jPlayer.event.canplay, _.bind(function (event) {
                    if (data.subtitleSrc && subtitles === true) {
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
                    
                    updateCompletedTime();
                    updateCurrentTime();
                    
                    if (stop) {
                        runStopListener(stop);
                    };
                    if (DEBUG) console.log(stepMedia);
                    
                    //async trouble
                    stepComments = that.getMediaElementComments({id : stepMedia.id, jqEl : "#markers-container"});
                    if (DEBUG) console.log(stepComments);
                    // unbind canplay
                    $(that.$el.jPlayer()).unbind($.jPlayer.event.canplay);
                }, that));
            }
            
            // get total ms elapsed in previous steps
            function updateCompletedTime() {
                if (that.timeLineStep > 0) {
                    for (var i = 0; i < that.timeLineStep; i++) {
                        timeLineComplete += parseInt(mediaElements[i].length);
                    }
                }
            }
            
            function updateCurrentTime() {
                var win = window,
                    updateIntv = setInterval(function() {
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
            }
            
            function runStopListener(stop) {
                var stopIntv = setInterval(function() {
                   if (that.$el.jPlayer().data().jPlayer.status.currentTime > stop/1000) {
                      if (tDEBUG) console.log('stop listener stop');
                      clearInterval(stopIntv);
                      $(that.$el.jPlayer()).trigger($.jPlayer.event.ended);
                   }
                },100);  
            }
            
            // trigger this on 'ended' event OR if we reach playheadStop
            function doNext() {
                that.timeLineStep++;
                that.playTimeLine();
            }
            
            // listen for stop
            function runStopListener(stop) {
                var intvId = setInterval(function() {
                   if (that.$el.jPlayer().data().jPlayer.status.currentTime > stop/1000) {
                      if (tDEBUG) console.log('stop listener stop');
                      clearInterval(intvId);
                      $(that.$el.jPlayer()).trigger($.jPlayer.event.ended);
                   }
                },100);  
            }
            
            function timeLineDone() {
                if (tDEBUG) console.log('finished');
                that.$el.jPlayer("pause");
                // reclass play button to restart timeline
                return;
            }
        },
        
        loadMegaTimeLine : function (opts) {
            var that = this,
                data = {},
                comments = [];
                
            data.elems = opts.mediaElements;
            _.each(data.elems, function (elem) {
                elem.width = ((elem.length / opts.timeLineLength)*100).toFixed(2);
            });
            console.log(opts);
            console.log(this.model.id);
            $('#mega-container').html(_.template($('#tmp-mega-timeline').html(), data));
            this.getMediaElementComments({id : this.model.id, jqEl : "#mega-markers-container", mega : true, timeLineLength : opts.timeLineLength});
        },
        
        loadCommentPopUp : function (data) {
            var data = {},
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
        
        // how many comment markers fit on a timeline?
        calcCommentMarkers : function (opts) {
            var markerArray, numbMarkers, markerSecs,
                that=this,
                playerData = this.$el.jPlayer().data('jPlayer').status;
            
            console.log(opts);
            if (opts && opts.mega === true) {
                numbMarkers = Math.floor($('.mega-timeline .bar').width() / 20); // [width of bar] / [ width of marker+4px ]
                markerSecs = Math.floor(opts.timeLineLength) / numbMarkers; // [ length of video ] / [ number of Markers ]
            } else {
                numbMarkers = Math.floor($('.jp-progress').width() / 20); // [width of bar] / [ width of marker+4px ]
                markerSecs = Math.floor(playerData.duration) / numbMarkers; // [ length of video ] / [ number of Markers ]
            }
            
            // build array of marker-points with start / stop attrs
            markerArray = []; 
            
            for (var i = 0; i < numbMarkers; i++) {
            
                function funcs(i) {
                    markerArray[i] = {};
                    markerArray[i].start = parseInt(i*markerSecs);
                    markerArray[i].stop = parseInt(markerArray[i].start + markerSecs);
                }
            
                funcs(i);
            }
            
            return { markerArray : markerArray, numbMarkers : numbMarkers};
        },
        
        // Make sure media is loaded before calling
        // or player values will be empty
        renderCommentMarkers : function (opts) {
            var that = this,
                markerArray = this.calcCommentMarkers(opts).markerArray;
                numbMarkers = this.calcCommentMarkers(opts).numbMarkers;
                comments = opts.comments;
                markers = [],
                j = 0,
                pos = 1;
                
            // now build array of populated marker positions for rendering
            console.log(markerArray);
            console.log(comments);
            console.log(opts);
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
            var data = {};
            
            data.items = opts.comments;
            // If error, just load view with no comments
            if (opts && opts.error === true) {
                data.error = true;
                data.items = [];
            }
            $("#comments-container").html(_.template($('#tmp-comments').html(), data));
            return this;
        },
        
        render : function () {
            this.delegateEvents();
        }
    });
    
    // Initialize with medi
    MegaTimeLineView = PlayListView.extend({
        // return all comments for playlist
        getPlayListComments : function (id) {
            
        },
        
        // initialize with timeline data
        loadMegaTimeLine : function (opts) {
            var that = this,
                data = {},
                comments = [];
            
            data.elems = opts.mediaElements;
            _.each(data.elems, function (elem) {
                elem.width = ((elem.length / opts.timeLineLength)*100).toFixed(2);
            });
            console.log(opts);
            console.log(this.model.id);
            $('#mega-container').html(_.template($('#tmp-mega-timeline').html(), data));
            this.getMediaElementComments({id : this.model.id, jqEl : "#mega-markers-container", mega : true, timeLineLength : opts.timeLineLength});
        },
        
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
            var data = {};
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