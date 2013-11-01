// this catches ie8 and ff
ie8 = function () {
    var bad = false;
    if (ViddlerPlayer.browser[0] === "Firefox") bad = true;
    if (ViddlerPlayer.browser[0] === "MSIE" && ViddlerPlayer.browser[1].indexOf(8) === 0) bad = true;
    return bad;
}();

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
            }
            this.vent = opts.vent; 
        },
        
        ie8 : function () {
            var bad = false;
            if (ViddlerPlayer.browser[0] === "Firefox") bad = true;
            if (ViddlerPlayer.browser[0] === "MSIE" && ViddlerPlayer.browser[1].indexOf(8) === 0) bad = true;
            return bad;
        }(),
        
        initialize : function (opts) {
            if (DEBUG) console.log('IE8 :', this.ie8)
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
        stopListenerIntv : {},
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
        
        runTimeListener : function (opts) {
            var that = this,
                timeLinePercent,
                playBarWidth;
                
                // update global timeline data
                this.timeListenerIntv = setInterval(function() {
                    window.vplm.tlNow = parseInt(that.$el.jPlayer().data().jPlayer.status.currentTime*1000 + window.vplm.tlElapsed - that.mediaEl.playheadStart, 10);
                    if ((that.$el.jPlayer().data().jPlayer.status.currentTime*1000)-that.mediaEl.playheadStart >= that.mediaEl.length) {
                        if (DEBUG) console.log("[Player]Clear Time Listener Interval");
                        clearInterval(that.timeListenerIntv);
                    }
                    timeLinePercent = (window.vplm.tlNow / window.vplm.tlLength);
                    playBarWidth = timeLinePercent*$('.jp-progress').width();
                    
                    if (tDEBUG ) {
                        console.log('[Player]step: '+window.vplm.tlStep);
                        console.log('[Player]current: '+window.vplm.tlNow);
                        console.log('[Player]elapsed: '+window.vplm.tlElapsed);
                        console.log('[Player]playheadStart: '+that.mediaEl.playheadStart);
                        console.log('[Player]total: '+window.vplm.tlLength);
                        console.log('[Player]timeline-percent: '+timeLinePercent);
                        console.log('[Player]playerTime: '+that.$el.jPlayer().data().jPlayer.status.currentTime);
                    }
                    
                    // override for drag event on playbar
                    if (playBarWidth > 0 && !window.vDrags) {
                        $('.jp-mega-play-bar').width(playBarWidth);
                    } 
                    if (timeLinePercent > 1) {
                        $('.jp-mega-play-bar').width('100%');
                    }
                    
                    // don't update until we have good global data
                    if (window.vplm.tlNow > 0) {
                        $('.viddler-current-time').html(that.secs2time(Math.floor(window.vplm.tlNow/1000)));
                    }
                    if (window.vplm.tlNow > window.vplm.tlLength) {
                        $('.viddler-current-time').html(that.secs2time(Math.floor(window.vplm.tlLength/1000)));                        
                    }
                },1000);  // run this faster in production
        },
        
        // listen for global step end time 
        runStopListener : function () {
            var that = this;
            if (DEBUG) console.log('[Player] stoplistener stop time', window.vplm.stepStop);
            this.stopListenerIntv = setInterval(function() {
               if (that.$el.jPlayer().data().jPlayer.status.currentTime > window.vplm.stepStop/1000) {
                  if (DEBUG) console.log('stop listener stop');
                  clearInterval(that.stopListenerIntv);
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
        
            (hours !== 0) ? time = hours+":" : time = hours+":";
            if (minutes != 0 || time !== "") {
              minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
            } else {
                minutes = "00:";
            }  
            time += minutes+":";
            if (seconds === 0) { 
                time+="00";
            } else {
                time += (seconds < 10) ? "0"+seconds : String(seconds);
            }
            return time;
        },
        
        loadVPlayer : function (opts) {
            var that = this,
                jPData = {
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
                    backgroundColor: '#grey',
                    errorAlerts : true,
                    solution : "html, flash",
                },
                width,
                height;

                
            if (this.ie8) {
                width = this.$el.width();
                height = this.$el.height();
                jPData.size = {
                    width : width,
                    height : height
                };
            }
            this.$el.jPlayer(jPData);
            $('.jp-comment').unbind();
            $('.jp-comment').on('click', function (e) {
                e.preventDefault();
                that.loadCommentPopUp();
                return false;
            });
        },
        
       loadCommentPopUp : function (opts) {
            var data = {},
            playerData = this.$el.jPlayer().data().jPlayer.status;
            data.time = secs2time(Math.floor(playerData.currentTime));
            data.avatar = "http://placekitten.com/75/75";
            commentModal = new CreateCommentView({
                data : data,
                tmp : "#tmp-comment-popup"
            });
            commentModal.render();
        },
        
         // Player controls 
         setMedia : function (opts) {
            var data = {},
                that = this;
                
            if (!this.ie8) {
                 $('#load-wait').show();
             }
             data[opts.type] = opts.url;
             this.$el.jPlayer("setMedia", data);
             // @@ this doesn't work in IE8
             //this.$('video').attr('oncanplay', "console.log('CANNNNN'); $('#load-wait').hide(); ViddlerPlayer.vent.trigger('mediaReady');");
             if (!this.ie8) {
                 this.$el.on(($.jPlayer.event.canplay), function () {
                     if (DEBUG) console.log("JPLAYER EVENT: canplay");
                     $('#load-wait').hide();
                     ViddlerPlayer.vent.trigger('mediaReady');
                 });
             } else {
                 if (DEBUG) console.log("IE8 / FF setMedia");
                 ViddlerPlayer.vent.trigger('mediaReady');
             }
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
    
    VPlayerGuiView = Backbone.View.extend({
        el : ".jp-gui",
        vplm : window.vplm,
        
        commentModal : function () {
            data = {};
            data.time = 123; // @@ Math.floor(playerData.currentTime);
            data.avatar = "http://placekitten.com/75/75";
            commentModal = new CreateCommentView({
                data : data,
                tmp : "#tmp-comment-popup"
            });
            commentModal.render();
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
            
            // calculate track info
            data.elems = opts.mediaElements;
            _.each(data.elems, function (elem) {
                elem.width = (((elem.playheadStop - elem.playheadStart) / window.vplm.tlLength)*100).toFixed(2);
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

    // This is the outer view and houses the whole backbone app
    PlaylistView = BaseView.extend({
        el : "#jp_container_1",
        timeline : {},
        stepComments : [],
        
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
                    commentsView = new CommentsListView({collection : collection});
                    commentsView.render();
                },
                error : function (collection, response) {
                    if (DEBUG) console.log("[Player] Error loading comments");
                    return {};
                }  
            });
        },
        
        loadPlayList : function (opts) {
            var that = this;
            this.model.fetch({
                success : function (model, response, opts) {
                    console.log(model);
                    if (model.gate) {
                        gate = new GateView({
                            tmp : '#tmp-gate-form',
                            message : model.gate.message,
                            gateForm : model.gate.gateForm
                        });
                        gate.render();
                    } else {
                        that.timeline = model.get("timeline");
                        that.onModelReady();
                    }
                },
                error : function (model, response) {
                    console.log(response.error());
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
            
            if (DEBUG) console.log('[Player] Model Ready');
            // clear out player data
            window.vplm.destroy();
            
            mediaEls = this.timeline.mediaElements;
            mediaEl = mediaEls[window.vplm.tlStep];
                
            // calculate timeline length
            _.each(this.timeline.mediaElements, function (el) {
                tlLength +=  parseInt(el.playheadStop - el.playheadStart, 10);
            });
                        
            // initialize gui uses global timeline data
            window.vplm.tlStep = 0;
            window.vplm.tlSteps = mediaEls.length;
            window.vplm.tlLength = tlLength;           this.vPG = new VPlayerGuiView();
            this.vPG.render({mediaElements : mediaEls}); 
            
            // gui ready update index for seek events
            window.vplm.tlIndex = this.initTlIndex();  //initTlIndex also binds dom seek events
            
            // add play button overlay
            $('#play-overlay-button').show();
            
            // wait for gui in DOM and instance player
            ViddlerPlayer.vent.once("playerGuiReady", function () {
                if (DEBUG) console.log("[Player] Gui Ready");
                that.vP = new VPlayerView({mediaEl : mediaEl});
                
                // wait for player, load comments and continue
                ViddlerPlayer.vent.once('playerReady', function () {
                    that.onPlayerReady();
                });
                that.vP.loadVPlayer();
            });
            
        },
        
        onPlayerReady : function () {
            var timeOut = null,
                that = this,
                setPlayerHeight = function() {
                    that.$el.css({
                        minHeight : that.$el.width()/7
                    });
                };

            if (DEBUG) console.log('[Player] Player ready');
            if (Modernizr.video.h264 && Popcorn) that.pop = Popcorn("#jp_video_0");
            markers = new CommentMarkerView();
            markers.renderCommentMarkers({commentSpots : that.timeline.tlCommentMarkerPos, jqEl : "#mega-markers-container"});
            this.timelinePlay();
            $('.viddler-duration').html(that.vP.secs2time(Math.floor(window.vplm.tlLength/1000)));
            this.vP.clearGuiTime();
        },
        
        // do timeline step queue-ing
        timelinePlay : function (opts) {
            var mediaEl,
                opts = opts || {},
                that = this,
                stepOpts = {},
                tlStep = window.vplm.tlStep,
                tlSteps = window.vplm.tlSteps;
            
            if (tlStep != tlSteps) {
                mediaEl = this.timeline.mediaElements[tlStep];
                stepOpts.mediaEl = mediaEl;
                stepOpts.start = opts.start || mediaEl.playheadStart; // seekTo passes start time
                stepOpts.stop = mediaEl.playheadStop;
            }
            
            // a bit of basic routing here:
            if (opts.seek) {
                this.timelineStep(stepOpts);
            } else if (tlStep === 0) {
                // Init timeline
                if (DEBUG) console.log('[Player] Init timeline');
                stepOpts.init = true;
                this.timelineInit(stepOpts);
            } else if (tlStep < tlSteps) {
                this.timelineStep(stepOpts);
            } else {
                this.doEnd();
            }
        },
        
        timelineStep : function (opts) {
            var that = this;
            if (DEBUG) console.log("[Player] Timeline step: "+window.vplm.tlStep);

            window.vplm.stepStop = opts.stop;
            that.getElapsedTime();
            
            ViddlerPlayer.vent.once('stopListenerStop', function () {
                var i, els;
                window.vplm.tlStep++;
                // continue
                that.timelinePlay();
            });
            
            this.vP.setMediaEl(opts.mediaEl);
            
            if (!opts.init) {
                // set media and go
                ViddlerPlayer.vent.once("mediaReady", function () {
                    if (DEBUG) console.log("[Player] Media ready");
                    that.vP.runTimeListener();
                    that.vP.runStopListener();
                    that.vP.play({start : opts.start/1000});
                });
                this.vP.setMedia({
                    type : opts.mediaEl.elementType,
                    url : opts.mediaEl.elementURL
                });
            }
            if (opts.mediaEl.subtitleSrc && !ie8) {
                this.doSubtitles(opts.mediaEl.subtitleSrc);
            }

            this.vP.play({start : opts.start/1000});
            
            // load step comments
            this.getMediaElementComments({id : opts.mediaEl.id});
        },
        
        timelineInit : function (stepOpts) {
            var that = this;
            stepOpts.init = true;
            window.vplm.stepStop = stepOpts.stop;
            
            ViddlerPlayer.vent.once("mediaReady", function () {
                if (DEBUG) console.log("[Player] Media ready");
                that.vP.runTimeListener();
                that.vP.runStopListener();
            });
            
            this.vP.setMedia({
                type : stepOpts.mediaEl.elementType,
                url : stepOpts.mediaEl.elementURL
            });
            
            // load step comments
            this.getMediaElementComments({id : stepOpts.mediaEl.id});
            
            $('#play-overlay-button').show();
            // ios needs user initiated action to enable timeline js behaviors
            $('.jp-play, #play-overlay-button').bind('click.init', function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                console.log("Click init timeline");
                that.timelineStep(stepOpts);
                $('#play-overlay-button').hide();
                $('.jp-play').unbind('click.init');
                return false;
            });
        },
        
        doSubtitles : function (subtitleSrc) {
            if (!this.ie8) {
                // clear popcorn events from previous step
                if (this.pop.hasOwnProperty('destroy')) {
                    this.pop.destroy();
                }
                // add subtitles
                this.pop.parseSRT(subtitleSrc);
            }
        },
        
        // Set total  time for elsapsed mediaElements to global object
        getElapsedTime : function () {
            els = that.timeline.mediaElements;
            window.vplm.tlElapsed = 0;
            for (i = 0; i < window.vplm.tlStep; i++) {
                function func (i) {
                    window.vplm.tlElapsed += els[i].playheadStop - els[i].playheadStart;
                }
                
                func(i);
            }
        },
        
        // index timeline elements for seek events
        initTlIndex : function () {
            var mediaEls = this.timeline.mediaElements,
                tlSteps = mediaEls.length;
                tlIndex = [],
                that = this;
            
            // bind seek behavior to progress bar
            $('.bar .jp-progress').on('click', function (e) {
                if (window.vDrags) return false; // don't do click if we're dragging the scrubber
                console.log('this');
                e.preventDefault();
                var seekPerc = e.offsetX/($(e.currentTarget).width()),
                    tlMs = seekPerc*window.vplm.tlLength;
                that.seekTo(tlMs);
                return false;
            });
            
            // drag events for progress bar
            $('#time').mousedown(function (e) {
               e.preventDefault();
               window.vDrags = true
               console.log('mouseDown', e);
            });
            
            $(document).mousemove(function (e) {
                e.preventDefault();
                // make sure we're dragging, and we're targeting appropriate elements
                if (!window.vDrags) return;
                if (e.target.className !== "jp-progress" && e.target.className !== "jp-mega-play-bar") return;
                if (e.target.className === "jp-progress") {
                    width = (e.offsetX+'px');
                }
                if (e.target.className === "jp-mega-play-bar") {
                    width = (e.offsetX+'px');        
                }
                console.log('UP', window.vDrags);
                console.log(e);
                console.log(width);
                $('.jp-mega-play-bar').css({
                    width : e.offsetX+'px'
                });
            });
            
            $(document).mouseup(function (e) {
                var seekPerc,
                    width;
                
                e.preventDefault();
                e.stopImmediatePropagation();
                if (window.vDrags) {
                    console.log('mouseUp drag event');
                    if (e.target.id === "time") {
                        // play the segment on mouseup
                        seekPerc = $('.jp-mega-play-bar').width()/$('.bar .jp-progress').width();
                        tlMs = seekPerc*window.vplm.tlLength;
                        console.log('mouseup', seekPerc, tlMs);
                        that.seekTo(tlMs);
                    }
                    setTimeout(function () {
                        window.vDrags = false;
                    }, 500);
                    return false;
                } 
                return false;
             });
            
            for (var i = 0; i < tlSteps; i++) {
                function func (i) {
                    tlIndex[i] = {};
                    tlIndex[i]['start'] = (i === 0) ? 0 : tlIndex[i-1]['stop'];
                    tlIndex[i]['stop'] = tlIndex[i]['start'] + mediaEls[i]['playheadStop'] - mediaEls[i]['playheadStart'];
                }
                
                func(i);
            }
            
            return tlIndex;
        },
        
        // reinitialize and play timeline from seek point
        seekTo : function (tlMs) {
            console.log("SEEK EVENT >>>>>>>>>>>>>>>>");
            var mediaEls = this.timeline.mediaElements,
                seekInf = {},
                tlIndex = window.vplm.tlIndex,  // timeline start & stop by element
                elapsed = 0;

            function func (i) {
                if (tlMs >= tlIndex[i].start && tlMs < tlIndex[i].stop) {
                    seekInf['step'] = i;
                    seekInf['seekTo'] =  tlMs - elapsed + mediaEls[i].playheadStart;
                    return;
                }
                elapsed += tlIndex[i].stop - tlIndex[i].start;
            }
        
            for (var i = 0; i < tlIndex.length; i++) {
                func(i);
            }

            console.log(seekInf);
            
            // update the global tlStep
            window.vplm.tlStep = seekInf.step;
            ViddlerPlayer.vent.off("stopListenerStop");
            clearInterval(this.timeListenerIntv);
            this.timelinePlay({seek : true, start : seekInf.seekTo});
        },
        
        getStepSubtitles : function (opts) {
            // tba
        },
        
        getStepSprites : function (opts) {
            // tba
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
        
        // 
        doEnd : function (opts) {
            var that = this;

            if (DEBUG) console.log("Do end handler");
            this.vP.pause();
            ViddlerPlayer.vent.off("stopListenerStop");

            // reset global player data
            window.vplm.tlReset();
            that.timelinePlay();
        },
    });
    
    // orange comment markers
    CommentMarkerView = BaseView.extend({
        _calcMarkerPos : function () {
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
                markerArray = this._calcMarkerPos().markerArray,
                numbMarkers = this._calcMarkerPos().numbMarkers,
                commentSpots = opts.commentSpots,
                markers = [],
                j = 0,
                pos = 1,
                data = {};
                
            // now build array of populated marker positions for rendering
            if (DEBUG) {
                console.log('commentSpots:', commentSpots);
                console.log('markerArray:', markerArray);
                console.log(opts);                
            }
            _.each(markerArray, function(spot) {
                _.each(commentSpots, function (cPos) {
                    if (cPos*1000 >= spot.start && cPos*1000 <= spot.stop) {
                        markers[j] = {};
                        markers[j].start = spot.start;
                        markers[j].stop = spot.stop;
                        markers[j].pos = pos;
                        markers[j].left = ((100/numbMarkers)*pos)-(100/numbMarkers); // express the left value as a percent - subtract one width
                        j++;
                    }
                });
                pos++; // keep track of which position we're in
            });
            
            // now render this nonsense 
            data.markers = markers;
            if (DEBUG) console.log(data);
            $(opts.jqEl).html(_.template($('#tmp-comment-markers').html(), data));
        },
    });
    
    CommentsListView = BaseView.extend({
        el : "#comments-container",
        comments : {}, // @@DEPRECATE
        collection : {},
        curPage : 0,
        numPages : 0,
        perPage : 10,
        events : {
            'click .page-next' : 'doNext',
            'click .page-prev' : 'doPrev',
            'click .page-number' : 'doPage'
        },
        
        initialize : function (opts) {
            opts = opts || {};
            opts.tmp = opts.tmp || "#tmp-comments";
            this.collection = opts.collection;
            this.comments = this.collection.toJSON();
            this.numPages = this.collection.length / this.perPage;
            this.__init(opts);
        },
        
        doNext : function (e) {
            e.preventDefault();
            if (this.curPage < this.numPages) {
                this.curPage ++;
                this.render();
            }
        },
        
        doPrev : function (e) {
            e.preventDefault();
            if (this.curPage > 0) {
                this.curPage --;
                this.render();
            }
        },
        
        doPage : function (e) {
            e.preventDefault();
            console.log(e); 
            console.log(e.target.dataset.page);
            this.curPage = parseInt(e.target.dataset.page,10);
            this.render();
        },
        
        render : function () {
            var data = {},
                elsStart = this.curPage*this.perPage,
                elsStop = elsStart+this.perPage;
                
            data.items = this.comments.slice(elsStart, elsStop);
            data.total = this.collection.length;
            console.log(this.curPage, elsStart, elsStop, data)
            this.$el.html(this.template(data));
            this.renderPager();
        },
        
        renderPager : function () {
            var data = {};
            data.els = Math.floor(this.collection.length/this.perPage);
            data.first = (parseInt(this.curPage) === 0);
            data.last = (this.curPage === this.numPages-1);
            data.current = this.curPage;
            console.log(data);
            this.$('#comments-pager-container').html(_.template($("#tmp-comments-pager").html(), data));
        },
        
        // bind events on subview with jQuery
        bindEvents : function () {
            var that = this;
            ViddlerPlayer.vent.once('click .page-next', function (e) {
                console.log('ugh');
            })
        }
    });
    
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
            //this.delegateEvents();
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
        
        doLogin : function (e) {
            e.preventDefault();
           // alert('login!');
            // do api login call here
            this.modalClose();
            return false;
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
    });
    
    // @@ We'll need a generic submit for these?
    GateView = ModalView.extend({
        message : '',
        gateForm : '',
        
        initialize : function (opts) {
            this.message = opts.message;
            this.gateForm = opts.gateForm;
            this.__init(opts);
        },
        
        render : function () {
            var data = {};
            data.modalHeader = this.message;
            data.gateForm = this.gateForm;
            this.__render(data);
        }
    }); 
    
    UserSignupView = ModalView.extend({
       events : {
            'click #user-signup-submit' : 'doSignup'
        },
        
        doSignup : function (e) {
            e.preventDefault();
            //alert('signup');
            // do api signup here
            this.modalClose();
            return false;
        },
        
        render : function() {
            var data = {};
            data.modalHeader = "Sign up!";
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
            this.hide();
            return false;
        },
        
        hide : function () {
            $('#modal-outer').hide();
        },
        
        render : function (opts) {
            var data = {};
            data.time = Math.floor(window.vplm.tlNow/1000);
            if (data.time < 0) data.time = 0;
            this.setElement('#modal-container');
            //this.$el.html(this.template({time : window.vplm.tlNow}));
            this.$el.html(_.template($("#tmp-comment-popup").html(), data));
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
    
    /**
     * Utility
     **/
    var secs2time = function(seconds) {
            var hours   = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds - (hours * 3600)) / 60);
            var seconds = seconds - (hours * 3600) - (minutes * 60);
            var time = "";
        
            (hours !== 0) ? time = hours+":" : time = hours+":";
            if (minutes != 0 || time !== "") {
              minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
            } else {
                minutes = "00:";
            }  
            time += minutes+":";
            if (seconds === 0) { 
                time+="00";
            } else {
                time += (seconds < 10) ? "0"+seconds : String(seconds);
            }
            return time;
        }
})(jQuery);