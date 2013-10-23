/**
 * NOTE: All times in ms; convert to seconds as needed at point of use
 */
(function ($) {
    var DEBUG = false,
        tDEBUG = false;

    /* Abstract */
    window.BaseView = Backbone.View.extend({
        id : 'content',
        tag : 'div',
        el : '<br/>',
        vent : {},
        vplm : window.vplm,
        
        __init : function (opts) {
            opts = opts || {};
            if (opts.vent) this.vent = opts.vent; 
            if (opts.tmp) {
                this.template = _.template($(opts.tmp).html());            
            };
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
        } 
        
    });
    
    
    /**
     * Viddler wrapper around jPlayer
     **/
    VPlayerView = BaseView.extend({
        el : '#jquery_jplayer_1',
        mediaEl : {},
        initialize : function (opts) {
            this.mediaEl = opts.mediaEl;
            this.runTimeListener();
          //  this.runStopListener(opts.stop);
        },
        
        clearTime : function () {
            $('.viddler-current-time').html(this.secs2time(Math.floor(0)));  
        },
        // calculates relative timeline elapsed
        runTimeListener : function () {
            var stepMedia = this.mediaEl,
                that = this,
                timeLinePercent,
                playBarWidth;
            console.log(window.vplm);
            var updateIntv = setInterval(function() {
                window.vplm.tlNow = parseInt((that.$el.jPlayer().data().jPlayer.status.currentTime*1000) - stepMedia.playheadStart + window.vplm.tlElapsed, 10);
                if ((that.$el.jPlayer().data().jPlayer.status.currentTime*1000)-stepMedia.playheadStart >= stepMedia.length) {
                    clearInterval(updateIntv);
                }
                timeLinePercent = (window.vplm.tlNow / window.vplm.tlLength)
                playBarWidth = timeLinePercent*$('.jp-progress').width();
                
                if (tDEBUG ) {
                    console.log('current: '+window.vplm.tlNow);
                    console.log('elapsed: '+window.vplm.tlElapsed);
                    console.log('total: '+window.vplm.tlLength);
                    console.log(timeLinePercent);
                    console.log('playerTime: '+that.$el.jPlayer().data().jPlayer.status.currentTime);
                }
                $('.jp-mega-play-bar').width(playBarWidth);
                $('.viddler-current-time').html(that.secs2time(Math.floor(window.vplm.tlNow/1000)));
            },250);
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
        
        runStopListener : function (stop, func) {
            var that = this;
            var stopIntv = setInterval(function() {
               if (that.$el.jPlayer().data().jPlayer.status.currentTime > stop/1000) {
                  console.log('stop listener stop');
                  clearInterval(stopIntv);
                  $(that.$el.jPlayer()).trigger($.jPlayer.event.ended);
                  if (func) {
                      func();
                  }
               }
            },1000);
        },
        
        onPlayerReady : function () {
            console.log("ready");
            this.$el.jPlayer("setMedia", {"m4v" : "http://www.jplayer.org/video/m4v/Big_Buck_Bunny_Trailer_480x270_h264aac.m4v"});    
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
                    that.onPlayerReady();
                },
                swfPath: "../js/vendor/",
                supplied: "m4v",
                errorAlerts : true,
                solition : "flash"
            });
        },
        
        /**
         * Player methods wrap jPlayer 
         **/
         
         setMedia : function (opts) {
             var data = {},
                that = this;
             console.log(opts);
             data[opts.type] = opts.url;
             this.$el.jPlayer("setMedia", data);
         },
         
         play : function (opts) {
             var that = this;
             (opts && opts.start) ? start = opts.start : start = '';

                that.$el.jPlayer("play", start)
         }, 
         
         pause : function (e, opts) {
             this.$el.jPlayer("pause");
         },
         
        
        // wrap functions in can play
        onCanPlay : function (func) {
            if (DEBUG) console.log('v can Play call');
            $(this.el).on($.jPlayer.event.canplay, func());
            // works in webkit only?
        },
        
        doFoo : function () {
            console.log("Dog food");
        },
        
        onEnded : function (func) {
            func();
            // maybe we don't need the event?
            //$(this.el).on($.jPlayer.event.ended, func());
        }
    });
    
    // add controls for modals here
    VPlayerGuiView = Backbone.View.extend({
        el : ".jp-gui",
        vplm : window.vplm,
        
        events : {
            'click .jp-comment' : "loadCommentPopup"    
        },
        
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
            console.log(data);
            $('#mega-track-info-container').html("Foobar here");

//            $('#mega-track-info-container').html(_.template($('#tmp-mega-track-info').html(), data));

            $('.mega-timeline .bar .jp-seek-bar').on('click', function (e) {
                e.preventDefault();
                console.log("Seek click");
                var seekPerc = e.offsetX/($(e.currentTarget).width());
                return false;
            });
            
            //this.getMediaElementComments({id : this.model.id, jqEl : "#mega-markers-container", mega : true, timeLineLength : opts.timeLineLength});
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
*/        loadCommentPopUp : function (data) {
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
            this.$('.jp-comment').on('click', function () {
                that.loadCommentPopUp();
            });        }
    });

    // bind events in outer view
    // this is equivalent to PlayListView
    PlaylistView = BaseView.extend({
        el : "#jp_container_1",
        timeline : {},
        comments : [],
        events : {
            'click .jp-comment' : 'commentModal',
            'click #viddler-play' : "vPlay",
            'click #viddler-pause' : "vPause"
        },
        
        getMediaElementComments : function (opts) {
            var that = this,
                opts = opts || {},
                comments = {};
                
            if (opts.id) {
                // fetch mediaEl comments from vplm
            } else {
                _.each(this.timeline.mediaElements, function (el) {
                    comments = _.extend(comments, el.comments);
                });
                console.log(comments);
                // otherwise assume we want all of them
            }
        },
        
        // delegate player events to vP view
        vPlay : function (e) {
            console.log(e);
            e.preventDefault();
            this.vP.play();
            return false;
        },
        
        vPause : function (e) {
            e.preventDefault();
            console.log(e);
            this.vP.pause();  
            return false;
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
        
        initialize : function (opts) {
            var stepMedia;
            _.bindAll(this, "vPlay");
            this.loadPlayList();
        },
        
        // initialize playlist environment
        onModelReady : function () {
            var that = this,
                mediaEl = {},
                tlLength = 0;
            
            // reset vplm global player data
            resetVplm();
            
            window.vplm.tlStep = 0;
            mediaEls = this.timeline.mediaElements
            mediaEl = mediaEls[window.vplm.tlStep];
                
            // calculate timeline length
            _.each(this.timeline.mediaElements, function (el) {
                // fetch comments from model
                if (el.comments.length > 0) {
                    _.each(el.comments, function (comment) {
                        that.comments.push(comment);
                    });
                }
                tlLength +=  parseInt(el.playheadStop - el.playheadStart, 10);
            });
            window.vplm.tlLength = tlLength;
            
            // make sure tlLength is set before rendering gui
            this.vPG = new VPlayerGuiView();
            this.vPG.render({mediaElements : mediaEls});
            
            // instance player view
            this.vP = new VPlayerView({
                mediaEl : mediaEl
            });
            
            // load player and continue
            $.when(this.vP.loadVPlayer()).done(function () {
                markers = new CommentMarkerView();
                markers.renderCommentMarkers({comments : that.comments, jqEl : "#mega-markers-container"});
                that.timelinePlay();                
            }
            );
            
            // get comment markers
/*
            markers = new CommentMarkerView();
            markers.renderCommentMarkers({comments : this.comments, jqEl : "#mega-markers-container"});
*/
            
            // instance player with initial mediaEl
           // this.timelinePlay();
        },
        
        // assume that the mediaElement is available from the vplm.tlStep and this.timeline
        timelinePlay : function (opts) {
            var start,
                stop,
                mediaEl,
                endWith,
                opts = opts || {};
            
            // some sensible defaults for end handler...
            if (window.vplm.tlStep < window.vplm.tlSteps) {
                opts.endFunc = this.doNext();
            }
            
            if (window.vplm.tlStep === window.vplm.tlSteps) {
                opts.endFunc = this.doEnd();
            }
            
            // but override with opts.endFunc
            if (opts.endFunc) opts.endFunc = opts.endFunc;
            mediaEl = this.timeline.mediaElements[window.vplm.tlStep];
            console.log(mediaEl);
            start = opts.start || mediaEl.playheadStart;
            stop = opts.stop || mediaEl.playheadStop;
            
            if (DEBUG) {
                console.log('Media: '+mediaEl);
                console.log('player start: '+start);
                console.log('player stop: '+stop);
            }
            
            this.vP.mediaEl = mediaEl;
            this.vP.onEnded(function () {console.log("ender's game")});
            this.vP.runTimeListener();
            this.vP.runStopListener(stop);
            this.vP.loadVPlayer();
/*
            this.vP.setMedia({
                type : mediaEl.elementType,
                url : mediaEl.elementURL
            });
*/
            this.vP.clearTime(); // set ui clock to 0
            //this.vP.play({start : start/1000});
            this.commentsView = new CommentsListView({comments : mediaEl.comments});
            this.commentsView.render();

        },
        
        doNext : function (opts) {
            console.log("Do next handler");
            if (window.vplm.tlStep < window.vplm.tlSteps) {
                window.vplm.tlStep++;
            } else {
                this.doEnd();
            }
        },
        
        doEnd : function (opts) {
            console.log("Do end handler");
        },
        
        render : function () {},
        
    });
    
    CommentMarkerView = BaseView.extend({
        calcCommentMarkers : function (opts) {
            var markerArray, numbMarkers, markerSecs,
                that=this,
            
            numbMarkers = Math.floor($('.mega-timeline .bar').width() / 20); // [width of bar] / [ width of marker+4px ]
            markerSecs = Math.floor(this.vplm.tlLength / numbMarkers); // [ length of video ] / [ number of Markers ]
            
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
            console.log(opts);
            if (DEBUG) console.log(data);
            console.log(_.template($('#tmp-comment-markers').html(), data));
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
        el : ".wrap",
                
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
                console.log('close modal');
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
            this.$el.html(_.template($("#tmp-comment-popup").html()));
/*
            $('.comment-close').on('click', function (e) {
                e.preventDefault();
                $('#modal-outer').hide();
                return false;
            });
*/
            $('#modal-outer').show();
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