ie8 = true;
/**
 * NOTE: All times in ms; convert to seconds as needed at point of use
 */
(function ($) {
    var DEBUG = true,
        // output clock data:
        tDEBUG = true;

    /* Abstract */
    window.BaseView = Backbone.View.extend({
        id : 'content',
        tag : 'div',
        el : '<br/>',
        vent : {},  // backbone event aggregator
        
        __init : function (opts) {
            opts = opts || {};
            //if (opts.vent) this.vent = opts.vent; 
            if (opts.tmp) {
                this.template = _.template($(opts.tmp).html());            
            };
            this.vent = opts.vent; 
        },
        
        initialize : function (opts) {
            this.__init(opts);
        },
        
        render : function () {
            this.$el.html(this.template());
        },
        
        checkAuth : function (opts) {
            
            return opts.isAuth;
        },
        
        checkSub : function (opts) {
            return opts.isSub;
        }, 
        
    });
    
    
    /**
     * Viddler wrapper around jPlayer
     **/
    VPlayerView = BaseView.extend({
        timeListenerIntv : {},
        el : '#jquery_jplayer_1',
        mediaEl : {}, // the currently loaded media element
        initialize : function (opts) {
            this.__init(opts);
            this.mediaEl = opts.mediaEl;
        },
        clearGuiTime : function () {
            $('.viddler-current-time').html(this.secs2time(Math.floor(0)));  
        },
        
        setMediaEl : function (mediaEl) {
            this.mediaEl = mediaEl;
        },
        
        // calculates relative timeline elapsed
        runTimeListener : function (opts) {
            var that = this,
                timeLinePercent,
                playBarWidth;
                
                
                this.timeListenerIntv = setInterval(function() {
                    window.vplm.tlNow = parseInt(that.$el.jPlayer().data().jPlayer.status.currentTime*1000 + window.vplm.tlElapsed - that.mediaEl.playheadStart, 10);
                    if ((that.$el.jPlayer().data().jPlayer.status.currentTime*1000)-that.mediaEl.playheadStart >= that.mediaEl.length) {
                        if (DEBUG) console.log("CLEAR TIME LISTENER INTERVAL");
                        clearInterval(that.timeListenerIntv);
                    }
                    timeLinePercent = (window.vplm.tlNow / window.vplm.tlLength)
                    playBarWidth = timeLinePercent*$('.jp-progress').width();
                    
                    if (tDEBUG ) {
                        console.log('step: '+window.vplm.tlStep);
                        console.log('current: '+window.vplm.tlNow);
                        console.log('elapsed: '+window.vplm.tlElapsed);
                        console.log('playheadStart: '+that.mediaEl.playheadStart);
                        console.log('total: '+window.vplm.tlLength);
                        console.log(timeLinePercent);
                        console.log('playerTime: '+that.$el.jPlayer().data().jPlayer.status.currentTime);
                    }
                    
                    // @@todo - these are ui tweaks to account for some looseness above
                    if (timeLinePercent <= 1) {
                        $('.jp-mega-play-bar').width(playBarWidth);
                    } else {
                        $('.jp-mega-play-bar').width('100%');
                    }
                    
                    // don't update until we have good global data
                    if (window.vplm.tlNow > 0) {
                        $('.viddler-current-time').html(that.secs2time(Math.floor(window.vplm.tlNow/1000)));
                    }
                    if (window.vplm.tlNow > window.vplm.tlLength) {
                        $('.viddler-current-time').html(that.secs2time(Math.floor(window.vplm.tlLength/1000)));                        
                    }
                },1000);
        },
        
        // listen for global step end time 
        runStopListener : function () {
            var that = this;
            console.log('stoplistener stop time', window.vplm.stepStop);
            var stopIntv = stopIntv || setInterval(function() {
               if (that.$el.jPlayer().data().jPlayer.status.currentTime > window.vplm.stepStop/1000) {
                  if (DEBUG) console.log('stop listener stop');
                  clearInterval(this.stopIntv);
                  // do we need to clear the time listener?
                  clearInterval(that.timeListenerIntv);
                  ViddlerPlayer.vent.trigger('stopListenerStop');
               }
            },1000);
        },
        
        // utility = convert seconds to 00:00:00 format
        secs2time : function(seconds) {
            var hours   = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds - (hours * 3600)) / 60);
            var seconds = seconds - (hours * 3600) - (minutes * 60);
            var time = "";
        
            (hours != 0) ? time = hours+":" : time = hours+":";
            if (minutes != 0 || time !== "") {
              minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
            } else {
                minutes = "00:"
            }  
            time += minutes+":";
            if (seconds === 0) { 
                time+="00" 
            } else {
                time += (seconds < 10) ? "0"+seconds : String(seconds);
            }
            return time;
        },
        
        loadVPlayer : function (opts) {
            var that = this;
            this.$el.jPlayer({
                ready: function () {
                    // bind events once player is ready
                    if (DEBUG) {
                        $('#inspector').jPlayerInspector({
                            jPlayer : $("#jquery_jplayer_1")
                        });
                    }
                    ViddlerPlayer.vent.trigger("playerReady");
                },
                swfPath: "../js/vendor/",
                supplied: "m4v",
                errorAlerts : true,
                solition : "html, flash"
            });
            $('.jp-comment').unbind();
            $('.jp-comment').on('click', function (e) {
                e.preventDefault();
                that.loadCommentPopUp();
                return false;
            });
        },
        
       loadCommentPopUp : function (data) {
            var data = {},
            playerData = this.$el.jPlayer().data().jPlayer.status;
            data.time = Math.floor(playerData.currentTime);
            data.avatar = "http://placekitten.com/75/75";
            commentModal = new CreateCommentView({
                data : data,
                tmp : "#tmp-comment-popup"
            });
            commentModal.render();
        },
        
        /**
         * Player methods wrap jPlayer 
         **/
         
         setMedia : function (opts) {
             var data = {},
                that = this;
             data[opts.type] = opts.url;
             this.$el.jPlayer("setMedia", data);
             ViddlerPlayer.vent.trigger('mediaReady');
         },
         
         play : function (opts) {
             var that = this,
                 opts = opts || {};
             (opts.start) ? start = opts.start : start = '';
             this.$el.jPlayer("play", start);
         }, 
         
         pause : function () {
             this.$el.jPlayer("pause");
         }
    });
    
    // add controls for modals here
    VPlayerGuiView = Backbone.View.extend({
        el : ".jp-gui",
        vplm : window.vplm,

        // load comment modal
        commentModal : function () {
            data = {};
            data.time = 123//Math.floor(playerData.currentTime);
            data.avatar = "http://placekitten.com/75/75";
            commentModal = new CreateCommentView({
                data : data,
                tmp : "#tmp-comment-popup"
            });
            commentModal.render();
        },
        
        loadMegaTimeline : function (opts) {
            var that = this,
                data = {},
                comments = [];
                
            data.elems = opts.mediaElements;
            _.each(data.elems, function (elem) {
                elem.width = ((elem.length / window.vplm.tlLength)*100).toFixed(2);
            });

            $('.mega-timeline .bar .jp-seek-bar').on('click', function (e) {
                e.preventDefault();
                var seekPerc = e.offsetX/($(e.currentTarget).width());
                return false;
            });
            
        },
        
        loadCommentPopUp : function (data) {
            var data = {},
            playerData = this.$el.jPlayer().data().jPlayer.status;
            data.time = Math.floor(playerData.currentTime);
            data.avatar = "http://placekitten.com/75/75";
            commentModal = new CreateCommentView({
                data : data,
                tmp : "#tmp-comment-popup"
            });
            commentModal.render();
        },
        
        render : function(opts) {
            var data = {},
                that=this;
            // load player controls
            this.$el.html(_.template($('#tmp-mega-gui').html()));
            
            // calc and render track info
            data.elems = opts.mediaElements;
            _.each(data.elems, function (elem) {
                elem.width = ((elem.length / window.vplm.tlLength)*100).toFixed(2);
            });
            $('#jp-mega-playbar-container').html(_.template($('#tmp-mega-timeline').html(), data));
            this.$('.jp-comment').on('click', function (e) {
                e.preventDefault();
                that.loadCommentPopUp();
                return false;
            });
            ViddlerPlayer.vent.trigger("playerGuiReady");
        }
    });

    // bind events in outer view
    // this is equivalent to PlayListView
    PlaylistView = BaseView.extend({
        el : "#jp_container_1",
        timeline : {},
        comments : [],
        
        initialize : function (opts) {
            this.__init(opts);
            this.loadPlayList();
        },
        
        getMediaElementComments : function (opts) {
            var that = this,
                comments = {};
                
            commentCollection = new CommentCollection([], {media_element : opts.id});
            commentCollection.fetch({
                success : function (collection, response) {
                     that.comments = collection.toJSON();
                },
                error : function (collection, response) {
                    if (DEBUG) console.log("Error loading comments");
                    return {};
                }  
            });
        },
        
        loadPlayList : function (opts) {
            var that = this;
            this.model.fetch({
                success : function (model, response, opts) {
                    that.timeline = model.get("timeline");
                    that.onModelReady();
                },
                error : function (model, response) {
                    error = new ErrorMsgView({
                        errorType : "server",
                        errorMsg : "Error retrieving playlist data from server"
                    }).set();
                }
            });
        },
        
        // initialize playlist environment
        onModelReady : function () {
            var that = this,
                mediaEl = {},
                tlLength = 0;
            
            // clear out player data
            window.vplm.destroy();
            
            mediaEls = this.timeline.mediaElements
            mediaEl = mediaEls[window.vplm.tlStep];
                
            // calculate timeline length
            _.each(this.timeline.mediaElements, function (el) {
                tlLength +=  parseInt(el.playheadStop - el.playheadStart, 10);
            });
            
            window.vplm.tlStep = 0;
            window.vplm.tlSteps = mediaEls.length;
            window.vplm.tlLength = tlLength;
            
            // render gui
           this.vPG = new VPlayerGuiView();
           this.vPG.render({mediaElements : mediaEls}); 

            // add play button overlay
            $('#play-overlay-button').show();
            
            // wait for gui in DOM and instance player view
            ViddlerPlayer.vent.once("playerGuiReady", function () {
                console.log("playerGuiReady");
                that.vP = new VPlayerView({mediaEl : mediaEl});
                
                // wait for player, load comments and continue
                that.getMediaElementComments({id : that.model.id});
                ViddlerPlayer.vent.once('playerReady', function () {
                    if (!ie8) that.pop = Popcorn("#jp_video_0");
                    if (DEBUG) console.log('Player ready event');
                    markers = new CommentMarkerView();
                    markers.renderCommentMarkers({comments : that.comments, jqEl : "#mega-markers-container"});
                    that.timelinePlay();
                    $('.viddler-duration').html(that.vP.secs2time(Math.floor(window.vplm.tlLength/1000)));
                    that.vP.clearGuiTime();
                });
                
                that.vP.loadVPlayer();
            });
            
        },
        
        // assume that the mediaElement is available from the vplm.tlStep and this.timeline
        timelinePlay : function (opts) {
            var start,
                stop,
                mediaEl,
                endWith,
                that = this,
                opts = opts || {},
                stepOpts = {},
                tlStep = window.vplm.tlStep,
                tlSteps = window.vplm.tlSteps;
            
            if (tlStep != tlSteps) {
                mediaEl = this.timeline.mediaElements[tlStep];
                stepOpts.mediaEl = mediaEl;
                stepOpts.start = opts.start || mediaEl.playheadStart;
                stepOpts.stop = opts.stop || mediaEl.playheadStop;
            }
            
            // init timeline
            if (tlStep === 0) {
                // Initial Play
                // iOS needs initial media play to be contained in user-initiated call stack
                console.log('Init timeline');
                $('.jp-play, #play-overlay-button').bind('click.init', function (e) {
                    console.log("Click init event", opts);
                    e.stopImmediatePropagation();                    
                    e.preventDefault();
                    that.timelineStep(stepOpts);
                    //that.vP.play({start : opts.start/1000});
                    $('#play-overlay-button').hide();
                    $('.jp-play').unbind('click.init');
                    return false;
                });
            } else if (tlStep < tlSteps) {
                this.timelineStep(stepOpts);
            } else {
                this.doEnd();
            }
            // fire this step
        },
        
        timelineStep : function (opts) {
            var that = this;
            if (DEBUG) console.log(opts);
            window.vplm.stepStop = opts.stop;
            
            // just in case
            // ViddlerPlayer.vent.off('stopListenerStop');
            
            ViddlerPlayer.vent.once('stopListenerStop', function () {
                var i, els;

                console.log("Increment step");
                window.vplm.tlStep++;
                
                // update global elapsed time
                els = that.timeline.mediaElements;
                window.vplm.tlElapsed = 0;
                for (i = 0; i < window.vplm.tlStep; i++) {
                    function func (i) {
                        window.vplm.tlElapsed += els[i].playheadStop - els[i].playheadStart;
                    }
                    
                    func(i);
                }
                
                // @@ maybe fix the progress bar jazz here
                // ...
                
                // continue
                that.timelinePlay();

/*
                if (window.vplm.tlStep === window.vplm.tlSteps-1) {
                    console.log('>>>>>END');
                    that.doEnd();
                } else {
                    console.log("Increment step");
                    window.vplm.tlStep++;
                    
                    // update global elapsed time
                    els = that.timeline.mediaElements;
                    window.vplm.tlElapsed = 0;
                    for (i = 0; i < window.vplm.tlStep; i++) {
                        function func (i) {
                            window.vplm.tlElapsed += els[i].playheadStop - els[i].playheadStart;
                        }
                        
                        func(i);
                    }
                    that.timelinePlay();
                }
*/
            });
            
            // set media and go
             ViddlerPlayer.vent.once("mediaReady", function () {
                console.log("Media update event");
                console.log('global stop:',window.vplm.stepStop);
                that.vP.runTimeListener();
                that.vP.runStopListener();
                that.vP.play({start : opts.start/1000});
            });
            
            this.vP.setMediaEl(opts.mediaEl);
            
            this.vP.setMedia({
                type : opts.mediaEl.elementType,
                url : opts.mediaEl.elementURL
            });
            
            
            console.log("tlStep", window.vplm);
            
            // @@this can go in another view method
            if (opts.mediaEl.subtitleSrc && !ie8) {
                // clear popcorn events from previous step
                if (that.pop.hasOwnProperty('destroy')) {
                    that.pop.destroy();
                }
                // add subtitles
                that.pop.parseSRT(opts.mediaEl.subtitleSrc);
            }
            
            // load step comments
            stepComments = this.getStepComments({id : opts.mediaEl.id});
            this.commentsView = new CommentsListView({comments : stepComments});
            this.commentsView.render();
        },
        
        getStepComments : function (opts) {
            var stepComments = [];
            _.each(this.comments, function (comment) {
                if (comment.media_element === opts.id) {
                    stepComments.push(comment);
                }
            });
            return stepComments;
        },
        
        doEnd : function (opts) {
            var that = this;

            if (DEBUG) console.log("Do end handler");
            this.vP.pause();
            ViddlerPlayer.vent.off("stopListenerStop");
            // should destroy timelistener also
            console.log(ViddlerPlayer.vent);
            // reset global player data
            window.vplm.tlReset();
            console.log('vplm post reset', vplm)
            $('#play-overlay-button').show();
            $(".jp-play, #play-overlay-button").on('click.init', function (e) {
                e.preventDefault();
                that.timelinePlay();
                $('#play-overlay-button').hide();
                $('.jp-play').unbind('click.init');
            });
        },
        
        // re-initialize loaded timeline
        resetTimeline : function () {
            
        }
        
    });
    
    CommentMarkerView = BaseView.extend({
        calcCommentMarkers : function (opts) {
            var markerArray, numbMarkers, markerSecs,
                that=this,
            
            numbMarkers = Math.floor($('.mega-timeline .bar').width() / 20); // [width of bar] / [ width of marker+4px ]
            markerSecs = Math.floor(window.vplm.tlLength / numbMarkers); // [ length of video ] / [ number of Markers ]
            
            // build array of marker-points with start / stop attrs
            markerArray = []; 
            
            for (var i = 1; i <+ numbMarkers; i++) {
                markerArray[0] = {};                
                markerArray[0].start = 0;
                markerArray[0].stop = markerSecs;
            
                function funcs(i) {
                    markerArray[i] = {};
                    markerArray[i].start = markerArray[i-1].stop + 1;
                    markerArray[i].stop = markerArray[i].start + markerSecs;
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
            if (DEBUG) {
                console.log(markerArray);
                console.log(comments);
                console.log(opts);                
            }
            _.each(markerArray, function(spot) {
                _.each(comments, function (comment) {
                    if (comment.time*1000 >= spot.start && comment.time*1000 <= spot.stop) {
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
            if (DEBUG) console.log(data);
           // $(opts.jqEL).html("FOOOO");
            $(opts.jqEl).html(_.template($('#tmp-comment-markers').html(), data));                
            // render proper context here
        },
    });
    
    CommentsListView = BaseView.extend({
        el : "#comments-container",
        comments : {},
        
        initialize : function (opts) {
            opts = opts || {};
            opts.tmp = opts.tmp || "#tmp-comments";
            this.comments = opts.comments || {};
            this.__init(opts);
        },
        
        render : function () {
            data = {};
            data.items = this.comments;
            this.$el.html(this.template(data));
        }
    });
    /**
     * Errors
     *
     **/
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
    
    /***
     * Modals
     *
     ***/
    ModalView = BaseView.extend({
                
        initialize : function (opts) {
            this.__init(opts);
        },
        
        modalClose : function () {
            $('.modalbg').hide();
            $('.loginmodal').html('');
        },
        
        __render : function(data) {
            var data = data || {};
            this.setElement('.loginmodal');
            this.delegateEvents();
            this.$el.html(this.template(data));
            $('.modal-close').on('click', function (e) {
                e.preventDefault();
                $('.modalbg').hide();
                $('.loginmodal').html('');
                return false;
            });
            $('.modalbg').show();
        }
    });
    
    UserLoginView = ModalView.extend({        
        events : {
            'click #user-login-submit' : 'doLogin',
        },
        
        doLogin : function () {
            alert('login!');
            // do api login call here
            this.modalClose();
        },
        
        render : function() {
            data = {};
            data.modalHeader = "Log in";
            this.__render(data);
        }
    });
    
    UserNoAuthView = UserLoginView.extend({
        render : function () {
            data = {};
            data.modalHeader = "Please sign in to view this content."
            this.__render(data);
        }
    }),
    
    UserSignupView = ModalView.extend({
       events : {
            'click #user-signup-submit' : 'doSignup'
        },
        
        doSignup : function () {
            alert('signup');
            // do api signup here
            this.modalClose();
        },
        
        render : function() {
            var data = {};
            data.modalHeader = "Sign up!"
            this.__render(data);
        }
    });
    
    CreateCommentView = ModalView.extend({
        el : '#modal-container',
        time : '123',
        events : {
            'click #comment-form-submit' : 'commentSubmit',
            'click .comment-close' : 'hide'
        },
        
        initialize : function (opts) {
            this.__init(opts);
            _.bindAll(this, 'commentSubmit', 'hide');
            this.data = opts.data;
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
            // do model save here
            alert("Submit comment");
            this.hide();
            // comment.save(comment.toJSON())
        },
        
        hide : function () {
            $('#modal-outer').hide();
        },
        
        render : function (opts) {
            this.setElement('#modal-container');
            //this.$el.html(this.template({time : window.vplm.tlNow}));
            this.$el.html(_.template($("#tmp-comment-popup").html(), {time : window.vplm.tlNow}));
            $('.comment-close').on('click', function (e) {
                e.preventDefault();
                $('#modal-outer').hide();
                return false;
            });
            $('#modal-outer').show();
            $('.modal-close').on('click', function (e) {
                e.preventDefault();
                $('#modal-container').html('');
                $('#modal-outer').hide();
            });
        }
    });
    
    SubscribeView = ModalView.extend({ });
    
    /**
     * Simple player to test events etc
     *
     **/
    
    TestPlayerView = Backbone.View.extend({
        el : "#jp_container_1",

        initialize : function (opts) {
            this.vPG = new VPlayerGui();
            this.vPG.render();
            
            this.vP = new VPlayerView();
            this.vP.loadVPlayer();
        },
        
        render : function () {}
    });
    
})(jQuery);