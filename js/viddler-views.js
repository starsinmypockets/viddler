/**
 * NOTE: All times in ms; convert to seconds as needed at point of use
 */
define(['underscore', 'jquery', 'backbone', 'viddler-events', 'viddler-collections', 'helper/util', 'viddler-manager', 'config'], function(_, $, Backbone, Events, Collections, Util, ViddlerManager, Config) {


    var Views = {};
        
    /* Abstract */
    Views.BaseView = Backbone.View.extend({
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
        
        initialize : function (opts) {
            if (Config.DEBUG) console.log('IE8 :', Util.ie8)
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
    
    
    Views.VPlayerGuiView = Backbone.View.extend({
        el : ".jp-gui",
        
        loadCommentPopUp : function (opts) {
            var data = {},
            commentModal = new Views.CreateCommentView({
                el : "#modal-outer",
                tmp : "#tmp-comment-popup"
            });
            commentModal.render();
        },
        
        commentOn : function () {
            $('.comments-jp').html('<a href="javascript:;" title="comments" class="jp-comment" tabindex="1"></a>');
        },
        
        commentOff : function () {
            $('.comments-jp').html('<span class="jp-no-video-comment"></span>')
        },
        
        render : function(opts) {
            var data = {},
                that=this;
            
            // load player controls
            this.$el.html(_.template($('#tmp-mega-gui').html()));
            
            // calculate track info
            data.elems = opts.mediaElements;
            _.each(data.elems, function (elem) {
                elem.width = (((elem.playheadStop - elem.playheadStart) / ViddlerManager.tlLength)*100).toFixed(2);
            });
            
            $('#jp-mega-playbar-container').html(_.template($('#tmp-mega-timeline').html(), data));
            this.$('.jp-comment').on('click', function (e) {
                e.preventDefault();
                that.loadCommentPopUp();
                return false;
            });

            Events.trigger("playerGuiReady");
        }
    });

    // This is the outer view and houses the whole backbone app
    Views.PlaylistView = Views.BaseView.extend({
        el : "#jp_container_1",
        timeline : {},
        stepComments : [],
        
        initialize : function (opts) {
            this.__init(opts);
            this.loadPlayList();
        },
        
        loadPlayList : function (opts) {
            var that = this;
            this.model.fetch({
                success : function (model, response, opts) {
                    if (model.gate) {
                        gate = new Views.GateView({
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
                    error = new Views.ErrorMsgView({
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
            
            if (Config.DEBUG) console.log('[Player] Model Ready');
            // clear out player data
            ViddlerManager.destroy();
            
            mediaEls = this.timeline.mediaElements;
            mediaEl = mediaEls[ViddlerManager.tlStep];
                
            // calculate timeline length
            _.each(this.timeline.mediaElements, function (el) {
                tlLength +=  parseInt(el.playheadStop - el.playheadStart, 10);
            });
                        
            // initialize gui uses global timeline data
            ViddlerManager.tlStep = 0;
            ViddlerManager.tlSteps = mediaEls.length;
            ViddlerManager.tlLength = tlLength;

            // wait for gui in DOM and instance player
            Events.once("playerGuiReady", function () {
            // IME Players
            
                require(_.values(Config.players), function () {
                    var Players = _.object(_.keys(Config.players), arguments);
                    if (Config.DEBUG) console.log("[Player] Gui Ready");
                    that.vP = new Players[mediaEl.elementType].View({mediaEl : mediaEl});
                    
                    // wait for player, load comments and continue
                    Events.once('playerReady', function () {
                        that.onPlayerReady();
                    });
                    that.vP.loadPlayer();
                });
            });

            this.vPG = new Views.VPlayerGuiView();
            ViddlerManager.mediaEls = mediaEls;
            this.vPG.render({mediaElements : mediaEls}); 
            
            // set Index info on manager
            ViddlerManager.initTlIndex();  //initTlIndex also binds dom seek events
            this.bindSeekEvents();
            this.bindThumbnailEvents();
            // add play button overlay
            $('#play-overlay-button').show();
            
        },
        
        onPlayerReady : function () {
            var timeOut = null,
                that = this,
                setPlayerHeight = function() {
                    that.$el.css({
                        minHeight : that.$el.width()/7
                    });
                };
            console.log('playerready');
            if (Config.DEBUG) console.log('[Player] Player ready');

            markers = new Views.CommentMarkerView();
            markers.renderCommentMarkers({commentSpots : that.timeline.tlCommentMarkerPos, jqEl : "#mega-markers-container"});
            this.bindCommentMarkerEvents();
            this.timelinePlay();
            $('.viddler-duration').html(Util.secs2time(Math.floor(ViddlerManager.tlLength/1000)));
            this.vP.clearGuiTime();
            this.vPG.commentOff();
        },
        
        // do timeline step queue-ing
        timelinePlay : function (opts) {
            var mediaEl,
                opts = opts || {},
                that = this,
                stepOpts = {},
                tlStep = ViddlerManager.tlStep,
                tlSteps = ViddlerManager.tlSteps;
            
//            this.vPG.commentOff();
            // @@ put this stuff into the manager   
            if (tlStep != tlSteps) {
                mediaEl = this.timeline.mediaElements[tlStep];
                stepOpts.mediaEl = mediaEl;
                stepOpts.start = opts.start || mediaEl.playheadStart; // seekTo passes start time
                stepOpts.stop = mediaEl.playheadStop;
            }
            
            // routing for timeline step:
            if (opts.seek) {
                this.timelineStep(stepOpts);
            } else if (tlStep === 0) {
                // Init timeline
                if (Config.DEBUG) console.log('[Player] Init timeline');
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
            if (Config.DEBUG) console.log("[Player] Timeline step: "+ViddlerManager.tlStep);
            
            ViddlerManager.mediaElId = opts.mediaEl.id;
            ViddlerManager.stepStop = opts.stop;
            that.getElapsedTime();
            
            Events.once('stopListenerStop', function () {
                var i, els;
                ViddlerManager.tlStep++;
                // continue
                that.timelinePlay();
            });
            
            this.vP.setMediaEl(opts.mediaEl);
            
            if (!opts.init) {
                // set media and go
                Events.once("mediaReady", function () {
                    if (Config.DEBUG) console.log("[Player] Media ready");
                    that.vPG.commentOn();
                    that.vP.runTimeListener();
                    that.vP.runStopListener();
                });
                this.vP.setMedia({
                    type : opts.mediaEl.elementType,
                    url : opts.mediaEl.elementURL
                });
            }
            
            if (opts.mediaEl.subtitleSrc) {
                Events.trigger('timelineStep:subtitles', that, opts.mediaEl.subtitleSrc);
            }
            
            if (opts.mediaEl.sprites && !Util.ie8) {
                Events.trigger('timelineStep:sprites', that, opts.mediaEl.sprites);
            }
            
            this.vP.play({start : opts.start/1000});
            
            // load step comments
            this.getMediaElementComments({id : opts.mediaEl.id});
        },
        
        timelineInit : function (stepOpts) {
            var that = this;
            stepOpts.init = true;
            ViddlerManager.stepStop = stepOpts.stop;
            ViddlerManager.stepMediaId = stepOpts.mediaEl.id;
            
            Events.once("mediaReady", function () {
                if (Config.DEBUG) console.log("[Player] Media ready");
                that.vP.runTimeListener();
                that.vP.runStopListener();
            });
            
            this.vP.setMedia({
                type : stepOpts.mediaEl.elementType,
                url : stepOpts.mediaEl.elementURL,
                poster : stepOpts.mediaEl.poster
            });
            
            // load step comments
            this.getMediaElementComments({id : stepOpts.mediaEl.id});
            
            $('#play-overlay-button').show();
            // ios needs user initiated action to enable timeline js behaviors
            $('.jp-play, #play-overlay-button').bind('click.init', function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                that.timelineStep(stepOpts);
                $('#play-overlay-button').hide();
                $('.jp-play').unbind('click.init');
                return false;
            });
        },
        
        getMediaElementComments : function (opts) {
            var that = this,
                comments = {},
                start = opts.start || null,
                stop = opts.stop || null;
            commentCollection = new Collections.CommentCollection([], {media_element : opts.id});
            commentCollection.fetch({
                success : function (collection, response) {
                    commentsView = new Views.CommentListView({collection : collection, start : start, stop : stop});
                    commentsView.render();
                },
                error : function (collection, response) {
                    if (Config.DEBUG) console.log("[Player] Error loading comments");
                    return {};
                }  
            });
        },
        
        // Set total  time for elsapsed mediaElements to global object
        getElapsedTime : function () {
            els = this.timeline.mediaElements;
            ViddlerManager.tlElapsed = 0;
            for (i = 0; i < ViddlerManager.tlStep; i++) {
                function func (i) {
                    ViddlerManager.tlElapsed += els[i].playheadStop - els[i].playheadStart;
                }
                
                func(i);
            }
        },
        
        // reinitialize and play timeline from seek point
        seekTo : function (tlMs) {
            if (Config.DEBUG) console.log("[Player] Seek event");
            var mediaEls = this.timeline.mediaElements,
                seekInf = {},
                tlIndex = ViddlerManager.tlIndex,  // timeline start & stop by element
                elapsed = 0;
            // yes
            $("#play-overlay-button").hide();
            seekInfo = ViddlerManager.getElTime(tlMs);
            if (Config.DEBUG) console.log(seekInfo);
            
            // update the global tlStep
            ViddlerManager.tlStep = seekInfo.step;
            Events.off("stopListenerStop");
            clearInterval(this.timeListenerIntv);
            this.timelinePlay({seek : true, start : seekInfo.time});
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

            if (Config.DEBUG) console.log("[Player] End handler");
            this.vP.pause();
            Events.off("stopListenerStop");

            // reset global player data
            ViddlerManager.tlReset();
            that.timelinePlay();
        },
        
        /**
         * Playlist event bindings
         **/
         // @@ Move to events module
        bindSeekEvents : function () {
            var that = this;
            
            // bind seek behavior to progress bar
            $('.bar .jp-progress').on('click', function (e) {
                var clickX,
                    seekPerc,
                    tlMs;
                if (window.vDrags) return false; // don't do click if we're dragging the scrubber
                e.preventDefault();
                tlMs = ViddlerManager.getTlMs(e);
                that.seekTo(tlMs);
                return false;
            });
            
            // drag events for progress bar
            $(document).mousedown(function (e) {
                if ($(e.target).attr("id") === "time"){
                    e.preventDefault();
                    window.vDrags = true;
                }
            });
            
            $("#time").bind("touchstart", function (e) {
                _pbDragStart(e);
            });
            
            $(document).bind("touchmove", function (e) {
                _pbDragMoveB(e);
            });
            
            $(document).bind("touchend", function (e) {
                _pbDragEnd(e);
            });
            
            $(document).mousemove(function (e) {
                _pbDragMove(e);
            });
            
             $(document).mouseup(function (e) {
                _pbDragEnd(e);
             });
             
             function _pbDragStart(e) {
                if ($(e.target).attr("id") === "time"){
                    e.preventDefault();
                    window.vDrags = true;
                }
             }
             
             function _pbDragMove(e) {
                var barCurWidth, playbarLeft;
                e.preventDefault();
                // make sure we're dragging, and we're targeting appropriate elements
                if (!window.vDrags) return;
                if (e.target.className !== "jp-progress" && e.target.className !== "jp-mega-play-bar") return;
                playbarLeft = $(".jp-progress").offset().left;
                $('.jp-mega-play-bar').css({
                    width : ((e.clientX - playbarLeft)+'px')
                });
             }
            
            /* Mobile */
            // @@ tested in iOS
            function _pbDragMoveB(e) {
                var barCurWidth, playbarLeft;
                e.preventDefault();
                // make sure we're dragging, and we're targeting appropriate elements
                if (!window.vDrags) return;
                playbarLeft = $(".jp-progress").offset().left;
                console.log(playbarLeft);
                $('.jp-mega-play-bar').css({
                    width : ((e.originalEvent.pageX - playbarLeft)+'px')
                });
             }
             
             function _pbDragEnd(e) {
                var seekPerc,
                    width;
                e.preventDefault();
                e.stopImmediatePropagation();
                if (window.vDrags) {
                    if (e.target.id === "time") {
                        // play the segment on mouseup
                        seekPerc = $('.jp-mega-play-bar').width()/$('.bar .jp-progress').width();
                        tlMs = seekPerc*ViddlerManager.tlLength;
                        that.seekTo(tlMs);
                    }
                    setTimeout(function () {
                        window.vDrags = false;
                    }, 500);
                    return false;
                } 
                return false;
             }
        },
        
        bindThumbnailEvents : function () {
            var that = this,
                t,
                t2,
                t3,
                i,
                barStay,
                data = {},
                thumbData = [],
                _getThumbs,
                playbarLeft = $(".jp-progress").offset().left;

            console.log(ViddlerManager.mediaEls.length);
            for (el in ViddlerManager.mediaEls) {
                thumbData.push(ViddlerManager.mediaEls[el].thumbs);
            }
            
            console.log(thumbData);
            
            _getThumbs = function (e) {
                tlMs = ViddlerManager.getTlMs(e);
                elTime = ViddlerManager.getElTime(tlMs); // return targeted step and tlMs of video el
                if (thumbData[elTime.step]) {
                    data.sprite_url = thumbData[elTime.step].spriteUrl;
                    _.each(thumbData[elTime.step].cues, function (cue) {
                        if (elTime.time >= cue.start && elTime.time < cue.stop) {
                            data.x = cue.x;
                            data.y = cue.y;
                            data.left = e.clientX - playbarLeft;
                            data.time = Util.secs2time(Math.round(tlMs/1000));
                        }
                    });
                    $('#thumbnail-container').html(_.template($('#tmp-thumb').html(), data));
                }
            }
            
            $('.jp-progress').mouseenter(function (e) {
                clearTimeout(t);
                clearTimeout(t2);
                t = setTimeout(function () {
                    if (!window.vDrags) {
                        _getThumbs(e)
                        barStay = true;
                    }
                }, 500);
            });
            $('.jp-progress').mouseout(function (e) {
                clearTimeout(t);
                t2 = setTimeout(function () {
                    $('.thumbnail-outer').hide();
                }, 500);
            });
            $('.jp-progress').mousemove(function (e) {
                t3 = setTimeout(function () {
                    if (barStay) {
                        _getThumbs(e);
                    }
                }, 250);
            });
        },
        // @@ Move to Events Module
        bindCommentMarkerEvents : function () {
            var that = this;
            
            // @@ TODO comment markers need stepMedia ID from manager then GO
            $('.orangearrow').on('click', function (e) {
                // gives us tl data
                var data = $(this).data(),
                    // get data relative to mediaEl
                    elData = ViddlerManager.getElTime(data.start*1000);
                
                that.getMediaElementComments({
                    id : data.mediaid,
                    start : elData.time/1000,
                    stop : data.stop - data.start + elData.time/1000
                });
            });
        }
    });
    
    // orange comment markers
    Views.CommentMarkerView = Views.BaseView.extend({
        events : {
            'click .orangearrow' : 'doClick'
        },
        
        doClick : function (e) {
            alert('click');
        },
        
        _calcMarkerPos : function () {
            console.log('hit');
            var markerArray, numbMarkers, markerSecs,
                that=this,
            
            numbMarkers = Math.floor($('.mega-timeline .bar').width() / 20); // [width of bar] / [ width of marker+4px ]
            markerSecs = Math.floor(ViddlerManager.tlLength / numbMarkers); // [ length of video ] / [ number of Markers ]
            
            // build array of marker-points with start / stop attrs
            markerArray = []; 
            markerArray[0] = {};                
            markerArray[0].start = 0;
            markerArray[0].stop = markerSecs;            
            for (var i = 1; i < numbMarkers; i++) {
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
            
            console.log(commentSpots);
            // now build array of populated marker positions for rendering
            _.each(markerArray, function(spot) {
                _.each(commentSpots, function (cPos) {
                    if (cPos*1000 >= spot.start && cPos*1000 <= spot.stop) {
                        markers[j] = {};
                        markers[j].start = Math.floor(spot.start/1000);
                        markers[j].stop = Math.floor(spot.stop/1000);
                        markers[j].mediaid = ViddlerManager.getMediaElFromTlTIme(spot.start).id;
                        markers[j].left = ((100/numbMarkers)*pos)-(100/numbMarkers); // express the left value as a percent - subtract one width
                        j++;
                    }
                   // console.log(ViddlerManager.getElTime(spot.start));
                });
                pos++; // keep track of which position we're in
            });
            data.markers = markers;
            $(opts.jqEl).html(_.template($('#tmp-comment-markers').html(), data));
        },
    });
    
    //@@ TODO should proba attach the media_el id duh
    Views.CommentListView = Views.BaseView.extend({
        el : "#comments-container",
        comments : [],
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
            var that = this,
                opts = opts || {},
                comments;
            opts.tmp = opts.tmp || "#tmp-comments";
            this.collection = opts.collection;
            if (opts.start) {
                that.comments = [];
                comments = this.collection.getByTimeRange({start : opts.start, stop : opts.stop});
                _.each(comments, function (comment) {
                    that.comments.push(comment.toJSON());
                });
                
            } else {
                this.comments = this.collection.toJSON();
            }
            _.each(this.comments, function (item) {
                item.time = Util.secs2time(item.time);
            });
            this.numPages = Math.ceil(this.comments.length / this.perPage);
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
            if (this.curPage > 0) {
                this.curPage --;
                this.render();
            }
        },
        
        doPage : function (e) {
            e.preventDefault();
            this.curPage = parseInt(e.target.dataset.page,10);
            this.render();
        },
        
        render : function () {
            var data = {},
                that = this,
                pagerStart = this.curPage*this.perPage,
                pagerStop = pagerStart+this.perPage;
                
            data.items = this.comments.slice(pagerStart, pagerStop);
            data.total = this.comments.length;
            this.$el.html(this.template(data));
            if (this.comments.length > this.perPage) {
                this.renderPager();
            }
        },
        
        renderPager : function () {
            var data = {};
            data.els = Math.ceil(this.comments.length/this.perPage);
            data.first = (parseInt(this.curPage) === 0);
            data.last = (this.curPage === this.numPages-1);
            data.current = this.curPage;
            this.$('#comments-pager-container').html(_.template($("#tmp-comments-pager").html(), data));
        },
    });
    
    Views.ErrorMsgView = Views.BaseView.extend({
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
    
    Views.ModalView = Views.BaseView.extend({
                
        initialize : function (opts) {
            this.__init(opts);
        },
        
        modalClose : function (e) {
            $('.modalbg').hide();
            $('#mask').hide();
            $('.loginmodal').html('');
            return false;
        },
        
        __render : function(data) {
            var data = data || {},
            that = this;
            
            this.setElement('.loginmodal');
            $('#mask').width($(document).width());
            $('#mask').height($(document).height());
            $('#mask').show();
            this.$el.html(this.template(data));
            
            $('.modal-close').on('click', function (e) {
                e.preventDefault();
                that.modalClose();
            });
            
            $('.modalbg').show();
        }
    });
    
    Views.UserLoginView = Views.ModalView.extend({        
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
    
    Views.UserNoAuthView = Views.UserLoginView.extend({
        render : function () {
            data = {};
            data.modalHeader = "Please sign in to view this content."
            this.__render(data);
        }
    });
    
    // @@ We'll need a generic submit for these?
    Views.GateView = Views.ModalView.extend({
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
    
    Views.UserSignupView = Views.ModalView.extend({
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
    
    Views.CreateCommentView = Views.ModalView.extend({
        el : '#modal-container',
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
            $('#modal-outer').html('').hide();
        },
        
        render : function (opts) {
            var that = this,
                data = {},
                t,
                timeOffset,
                comModTop,
                margLeft,
                updateModalPos,
                tlPerc = $('.jp-mega-play-bar').width() / $('.jp-progress').width()*100;
                //tlPerc = ViddlerManager.tlNow / ViddlerManager.tlLength *100;
            
            (ViddlerManager.tlNow < 0) ? t = 0 : t = ViddlerManager.tlNow;
            data.time = Util.secs2time(Math.floor(t/1000));
            this.$el.html(_.template($("#tmp-comment-popup").html(), data));
            //$('#modal-outer').show();
            
            pBL = $('.jp-progress').offset().left;
            pBW = $('.jp-progress').width();
            cMW = $('#modal-outer').width();
            console.log(tlPerc, pBL, pBW, cMW);
            
            $('#modal-outer').show();
            
            updateModalPos = function () {
                if (tlPerc <= 33) {
                    $('#modal-outer').css({'margin-left' : 0});
                }  
                
                if (tlPerc > 33 && tlPerc <= 66) {
                    $('#modal-outer').css({'margin-left' : (pBW - cMW)/2});
                }
                
                if (tlPerc > 66) {
                    $('#modal-outer').css({'margin-left' : pBW-cMW+50});
                }
                
                // position triangle relative to scrubber
                timeOffset = $('#time').offset().left;
                console.log(timeOffset, $('#modal-outer').height());
                $('#modaltriangle').css({
                    'margin-left' : timeOffset - $('#modal-outer').offset().left
                });
                
                comModTop = $('.jp-progress').offset().top - $('#modal-outer').height() -40;
                $('#modal-outer').offset({top : comModTop});
            }
            console.log($('.jp-progress').offset().top)
            if ($(window).width() > 480) updateModalPos();
            $('.comment-close, .modal-close').on('click', function (e) {
                e.preventDefault();
                that.hide();
                return false;
            });
            
        }
    });
    
    Views.SubscribeView = Views.ModalView.extend({ });
    

    return Views;
    
});
