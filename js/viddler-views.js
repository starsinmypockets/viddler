ie8 = true;
/**
 * NOTE: All times in ms; convert to seconds as needed at point of use
 */
(function ($) {
    var DEBUG = true,
        // output clock data:
        tDEBUG = false;

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
        el : '#jquery_jplayer_1',
        mediaEl : {},
        initialize : function (opts) {
            this.__init(opts);
            this.mediaEl = opts.mediaEl;
            console.log(this.mediaEl);
        },
        clearGuiTime : function () {
            $('.viddler-current-time').html(this.secs2time(Math.floor(0)));  
        },
        
        // calculates relative timeline elapsed
        runTimeListener : function (opts) {
            console.log(this.mediaEl.playheadStart);
            var that = this,
                timeLinePercent,
                playBarWidth,
                updateIntv = setInterval(function() {
                console.log("This one", parseInt(that.$el.jPlayer().data().jPlayer.status.currentTime*1000) + window.vplm.tlElapsed - that.mediaEl.playheadStart);
                    window.vplm.tlNow = parseInt(that.$el.jPlayer().data().jPlayer.status.currentTime*1000 + window.vplm.tlElapsed - that.mediaEl.playheadStart, 10);
//                    window.vplm.tlNow = parseInt((that.$el.jPlayer().data().jPlayer.status.currentTime*1000) - that.mediaEl.playheadStart + window.vplm.tlElapsed, 10);
                    if ((that.$el.jPlayer().data().jPlayer.status.currentTime*1000)-that.mediaEl.playheadStart >= that.mediaEl.length) {
                        console.log("CLEAR INTERVAL");
                        clearInterval(updateIntv);
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
                    $('.jp-mega-play-bar').width(playBarWidth);
                    if (window.vplm.tlNow > 0) {
                        $('.viddler-current-time').html(that.secs2time(Math.floor(window.vplm.tlNow/1000)));
                    
                    }
                },1000);
        },
        
        runStopListener : function (stop) {
            var that = this;
            var stopIntv = stopIntv || setInterval(function() {
               if (that.$el.jPlayer().data().jPlayer.status.currentTime > stop/1000) {
                  if (DEBUG) console.log('stop listener stop');
                  clearInterval(this.stopIntv);
                  ViddlerPlayer.vent.trigger('stopListenerStop');
               }
            },1000);
        },
        
        // utility = conver seconds to 00:00:00 format
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
                    that.vent.trigger("playerReady");
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
            console.log("comment");
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
         },
         
         play : function (opts) {
             var that = this;
             (opts && opts.start) ? start = opts.start : start = '';
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
s
            $('.mega-timeline .bar .jp-seek-bar').on('click', function (e) {
                e.preventDefault();
                console.log("Seek click");
                var seekPerc = e.offsetX/($(e.currentTarget).width());
                return false;
            });
            
        },
        
        // whack the player
/*
        destroyView : function () {
            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
        
            this.$el.removeData().unbind(); 
        
            //Remove view from DOM
            this.remove();  
            Backbone.View.prototype.remove.call(this);
        },
*/      

        loadCommentPopUp : function (data) {
            console.log("comment");
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
                    console.log(model);
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
            
            // reset vplm global player data
            resetVplm();
            
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
            
            // instance player view
            this.vP = new VPlayerView({
                mediaEl : mediaEl,
                vent : this.vent
            });
            
            
            // wait for player load player and continue

            this.getMediaElementComments({id : this.model.id});
            this.vent.bind('playerReady', function () {
                if (!ie8) that.pop = Popcorn("#jp_video_0");
                if (DEBUG) console.log('Player ready event');
                markers = new CommentMarkerView();
                markers.renderCommentMarkers({comments : that.comments, jqEl : "#mega-markers-container"});
                that.timelinePlay();
                $('.viddler-duration').html(that.vP.secs2time(Math.floor(window.vplm.tlLength/1000)));
                that.vent.off('playerReady');   
            });
    
            this.vP.loadVPlayer();
        },
        
        // assume that the mediaElement is available from the vplm.tlStep and this.timeline
        timelinePlay : function (opts) {
            var start,
                stop,
                mediaEl,
                endWith,
                that = this,
                opts = opts || {},
                stepOpts = {};
            
            mediaEl = this.timeline.mediaElements[window.vplm.tlStep];
            stepOpts.mediaEl = mediaEl;
            stepOpts.start = opts.start || mediaEl.playheadStart;
            stepOpts.stop = opts.stop || mediaEl.playheadStop;
            
            
            if (DEBUG) {
                console.log('mediaEl: ',mediaEl);
                console.log('player start: '+stepOpts.start);
                console.log('player stop: '+stepOpts.stop);
                console.log('vplm: ',window.vplm);
            }
            
            // fire this step
            this.timelineStep(stepOpts);
        },
        
        timelineStep : function (opts) {
            var that = this;
            if (DEBUG) console.log(opts);
            ViddlerPlayer.vent.off("stopListenerStop");
            this.vP.mediaEl = opts.mediaEl;
            this.vP.runTimeListener();
            this.vP.runStopListener(opts.stop);
            console.log("tlStep", window.vplm);
            if (opts.mediaEl.subtitleSrc && !ie8) {
                console.log("yeah");
                // clear popcorn events from previous step
                if (that.pop.hasOwnProperty('destroy')) {
                    that.pop.destroy();
                }
                // add subtitles
                that.pop.parseSRT(opts.mediaEl.subtitleSrc);
            }
            
            this.vP.setMedia({
                type : opts.mediaEl.elementType,
                url : opts.mediaEl.elementURL
            });
            
            // load step comments
            stepComments = this.getStepComments({id : opts.mediaEl.id});
            this.commentsView = new CommentsListView({comments : stepComments});
            this.commentsView.render();

            ViddlerPlayer.vent.bind('stopListenerStop', function () {
                var i, els;
                // check step, update global values and continue
                if (window.vplm.tlStep === window.vplm.tlSteps) {
                    ViddlerPlayer.vent.off("stopListenerStop");
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
            });
            
            if (window.vplm.tlStep === 0) {
                // Initial Play
                // iOS needs initial media play to be contained in user-initiated call stack
                $('.jp-play, #play-overlay-button').bind('click.init', function (e) {
                    e.preventDefault();
                    that.vP.play({start : opts.start/1000});
                    $('#play-overlay-button').hide();
                    $('.jp-play').unbind('click.init');
                    return false;
                });
                
            // auto-play on subsequent step
            } else {
                that.vP.play({start : opts.start/1000});
            }
            
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
            this.vP.pause();
            console.log("Do end handler");
            // reset playlist
            window.vplm.tlStep = 0;
            window.vplm.tlNow = 0;
            $('#play-overlay-button').show();
            $(".jp-play, #play-overlay-button").on('click.init', function (e) {
                e.preventDefault();
                that.vP.play({start : opts.start/1000});
                $('#play-overlay-button').hide();
                $('.jp-play').unbind('click.init');
            });
        },
        
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