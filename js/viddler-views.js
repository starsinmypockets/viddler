(function ($) {
    var DEBUG = true,
        tDEBUG = true;//true;

    /* Abstract */
    window.BaseView = Backbone.View.extend({
        id : 'content',
        tag : 'div',
        el : '<br/>',
        vent : {},
        
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
    
    // Instantiates jPlayer, handles comments etc
    // use this.$el.jPlayer() to manipulate player instance
    window.PlayListView = BaseView.extend({
        el : '#jp_container_1',
        jPlayer : {},
        pop : {}, //Popcorn.js
        timeline : {},
        // initialize playlist data - update from model
        data : {
            comments : {},        
            tlStep : 0,
            tlSteps :0,
            tlLength : 0,
            tlElapsed : 0,
            tlNow : 0,
        },
        jpTime : 0,
        
        getMediaElementComments : function (opts) {
            var that = this,
                comments = {};
                
            commentCollection = new CommentCollection([], {media_element : opts.id});
            commentCollection.fetch({
                success : function (collection, response) {
                     comments = collection.toJSON();
                     that.loadComments({comments : comments});
                     if (opts.mega===true)that.renderCommentMarkers({comments : comments, jqEl : opts.jqEl, timeLineLength : opts.timeLineLength/1000, mega : opts.mega});
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
            console.log("IE8: "+ie8);
            _.bindAll(this, 'commentSubmit');
        },
        
        
        // add to @@ vPlayer
        cueToPercent : function (opts) {
            var that = this,
                elems = this.timeline.mediaElements,
                relElapsed = 0,
                clicked = (this.data.tlLength * (opts.percent/100)),
                data = {}
                i = 0;;
                
                console.log(relElapsed);
                console.log(clicked);
                
            _.each(elems, function (elem) {
                elem.relStart = relElapsed;
                elem.relEnd = relElapsed + elem.playheadStop - elem.playheadStart;
                console.log(i, elem.relStart, elem.relEnd);
                if (clicked >= elem.relStart && clicked < elem.relEnd) {
                    start = Math.floor(clicked - relElapsed + elem.playheadStart);
                    elemIndex = i;
                    that.data.tlStep = i;
                } else {
                    i++;
                    relElapsed += elem.playheadStop - elem.playheadStart;                    
                }
            });

            if (DEBUG)console.log("Seek to", elemIndex, start);

            this.playTimeLine({
                start : start
            });
        },
        
        
        // @@ DEP move to vplayer
        canPlay : function(func) {
            // works in webkit only?
            $(this.$el.jPlayer()).on($.jPlayer.event.canplay, func()); //...
        },
        
        // @@ DEP move to vplayer
        onPlayerReady : function () {
            if (DEBUG) console.log('Player Ready Handler');
            if (!ie8) this.pop = Popcorn("#jp_video_0");
            $('#jp_video_0').attr('webkit-playsinline','');
            $('#jp_video_0').attr('webkitSupportsFullscreen', 'false');
          
            this.playTimeLine({init : true});
        },
        
        // when playlist model is loaded, initialize view params, load player & start timeline
        onModelReady : function () {
            var that = this,
                i;
                                
            if (DEBUG) {
                console.log('Model Ready Handler');
                console.log(this.model);
                error = new ErrorMsgView({
                    errorType : "generic",
                    errorMsg : "Testing error broadcasting system"
                }).set();
            }
            // set timeLineLength on the view
            mediaEls = this.model.get("timeline").mediaElements;
            if (DEBUG) console.log("Loaded media Elements: " + mediaEls);
            for (i = 0; i < mediaEls.length; i++) {
                funcs = function (i) {
                    that.data.tlLength += (mediaEls[i].playheadStop - mediaEls[i].playheadStart);
                }
                
                funcs(i);
            }
            
            vPG = new VPlayerGui();
            vPG.render();
            
            vP = new VPlayerView();
            vP.loadVPlayer();
            
            // or bind using backbone vent jawn
            
            // When model is loaded and player is ready, start timeline
   /*
     vP.onPlayerReady(function (that) {
                console.log('Wrapped ready function');
                that.loadMegaTimeLine({
                    mediaElements : mediaEls,
                    steps : that.data.tlSteps,
                    timeLineLength : that.data.tlLength
                });
        }, this);
*/
        },
        
        loadPlayList : function (opts) {
            var that = this;
            this.model.fetch({
                success : function (model, response, opts) {
                    that.timeline = model.get('timeline');
                    that.data.tlSteps = that.timeline.mediaElements.length;
                    that.onModelReady();
                    that.render();
                },
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
        // @@ move this to view below
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
                swfPath: "../js/vendor",
                supplied: "m4v, ogv",
                errorAlerts : true
            });
        },
        
        // Get the controls
        loadPlayerGui : function (opts) {
            var that = this;
            this.setElement('.jp-gui'); 
            this.$el.html(_.template($('#tmp-mega-gui').html()));

//            $('.jp-gui').html(_.template($('#tmp-mega-gui').html()));
            //this.$el.html(_.template($('#tmp-mega-gui').html()));
            this.$('.jp-comment').on('click', function () {
                that.loadCommentPopUp();
            });
        },
        
        playTimeLine : function (opts) {
            var progressCounterIntv,
                that = this,
                data = {},
                opts = opts || {},
                status = that.$el.jPlayer().data().jPlayer.status,
                mediaElements = this.timeline.mediaElements,
                steps = mediaElements.length;
                stepMedia = mediaElements[this.data.tlStep],
                timeLineLength = 0; // total length in ms of timeline
            
            console.log(opts);
            console.log(this.data.tlStep);
            /* Check Gates */
            
            if (!this.checkAuth({isAuth : true })) {
                if (DEBUG) console.log('Unauthorized');
                login = new UserSignupView({tmp : "#tmp-no-auth-form"});
                login.render();
                return;
            }
            
            if (!this.checkSub({isSub : true})) {
                if (DEBUG) console.log('No Sub');
                subscribe = new ModalView({tmp : "#tmp-subscribe"});
                subscribe.render();
                subscribe.delegateEvents();
                return;
            }
            
            _.each(mediaElements, function (el) {
                el.length = el.playheadStop - el.playheadStart;
                timeLineLength += el.length;
            });

            // initialize timeline
            if (opts.init === true) {
                if (DEBUG) console.log("Init timeline");
                $('#play-overlay-button').show();

                this.loadMegaTimeLine({
                    mediaElements : mediaElements,
                    steps : steps,
                    timeLineLength : timeLineLength
                });
                
                // bind seekbar click event
                $('.mega-timeline .jp-seek-bar').bind('click', function (e) {
                    var data = {};
                    console.log(e);
                    e.preventDefault();
                    data.percent = (e.offsetX / e.currentTarget.clientWidth) * 100;
                    that.cueToPercent(data);
                    return false;
                });
                
                // set ui clock to 0
                $('.viddler-current-time').html(secs2time(Math.floor(0)));

                $(that.$el.jPlayer()).bind($.jPlayer.event.ended, _.bind(doNext, that));
            }
            
            if (stepMedia) {
                data[stepMedia.elementType] = stepMedia.elementURL;
                data.subtitleSrc = stepMedia['subtitle-source'];
                data.sprites = stepMedia['sprites'];
                data.start = opts.start || stepMedia.playheadStart;
                data.stop = opts.stop || stepMedia.playheadStop;
                
                //  data['poster'] = stepMedia.poster;
                console.log(data);
                                    doTimeLineStep(data);
                
            }
            
            function renderSprite(html) {
                that.$el.append(html).find('.sprite').css({
                    position : "absolute",
                    top : 10,
                    left : 10
                });
            }
            
            function destroySprite(id) {
                $('*[data-sprite-id="'+id+'"]').remove();
            }
            
            function doTimeLineStep(data) {
                var playerData, 
                    duration,
                    subtitles = true; 

                that.$el.jPlayer("setMedia", data);

                $('.jp-play, #play-overlay-button').bind('click.init', function (e) {
                    e.preventDefault();
                    console.log('my click start')
                    that.$el.jPlayer("play", start/1000);
                    $('.jp-play').unbind('click.init');
                    return false;
                });    

                // @@ delegate to this.canPlay
                updateCurrentTime();

                if (data.subtitleSrc && subtitles === true && !ie8) {
                    // clear popcorn events from previous step
                    if (that.pop.hasOwnProperty('destroy')) {
                        that.pop.destroy();
                    }
                    // add subtitles
                    that.pop.parseSRT(data.subtitleSrc);
                }
                
                // Sprites
                if (data.sprites && !ie8) {
                    _.each(data.sprites, function (sprite) {
                        var spriteId = Math.random().toString(36).substring(7);  // give the sprite a temp id
                        that.pop.cue(sprite.start/1000, function () {
                            html = $(sprite.html).attr("data-sprite-id", spriteId);
                            renderSprite(html);
                        });
                        that.pop.cue(sprite.stop/1000, function () {
                            destroySprite(spriteId);   
                        });
                    });
                }
                
                // Subsequent plays autostart
                if (that.data.tlStep > 0) {
                    that.$el.jPlayer("play", data.start/1000);
                }
                
                playerData = that.$el.jPlayer().data('jPlayer').status;
                duration = Math.floor(playerData.duration*1000); // convert to ms
                
                // @@ don't run this until play
                $('.viddler-duration').html(secs2time(that.data.tlLength/1000));
                if (stop) {
                    runStopListener(data.stop);
                };
                
                if (DEBUG) console.log(stepMedia);
                
                //async trouble
                stepComments = that.getMediaElementComments({id : stepMedia.id, jqEl : "#markers-container"});
                if (DEBUG) console.log(stepComments);
            }
            
            // get total ms elapsed in previous steps
            // @@ DEPRECATE
            // @@ just add the last step's time to complete on done
            function updateCompletedTime() {
                if (tDEBUG) console.log('update step');
                if (that.data.tlStep > 0) {
                    for (var i = 0; i < that.data.tlStep; i++) {
                        function func (i) {
                            timeLineComplete += parseInt(mediaElements[i].length);
                        }
                        func(i);
                    }
                }
            }
            
            function updateCurrentTime() {
                if (stepMedia) {
                    var updateIntv = setInterval(function() {
                        that.data.tlNow = parseInt((that.$el.jPlayer().data().jPlayer.status.currentTime*1000) - stepMedia.playheadStart + that.data.tlElapsed, 10);
                        if ((that.$el.jPlayer().data().jPlayer.status.currentTime*1000)-stepMedia.playheadStart >= stepMedia.length) {
                            clearInterval(updateIntv);
                        }
                        timeLinePercent = (that.data.tlNow / that.data.tlLength)*100
                        if (tDEBUG) {
                            console.log('current: '+that.data.tlNow);
                            console.log('elapsed: '+that.data.tlElapsed);
                            console.log('total: '+that.data.tlLength);
                            console.log(timeLinePercent);
                            console.log('playerTime: '+that.$el.jPlayer().data().jPlayer.status.currentTime);
                        }
//                    $('.mega-timeline .jp-seek-bar').width('100%');
                        $('.mega-timeline .jp-seek-bar .jp-play-bar').width(timeLinePercent + '%');
                        $('.viddler-current-time').html(secs2time(Math.floor(that.data.tlNow/1000)));
                    },250);   
                }
            }
            
            // utility - return 01:55:10 format time
            function secs2time (seconds) {
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
            }
            
            function runStopListener(stop) {
                var stopIntv = setInterval(function() {
                   if (that.$el.jPlayer().data().jPlayer.status.currentTime > stop/1000) {
                      if (tDEBUG) console.log('stop listener stop');
                      clearInterval(stopIntv);
                      $(that.$el.jPlayer()).trigger($.jPlayer.event.ended);
                   }
                },1000);  
            }
            
            // trigger this on 'ended' event OR if we reach playheadStop
            function doNext() {
                that.data.tlElapsed += stepMedia.length;
                that.data.tlStep++;
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
                // clear timers
                that.data.tlElapsed=0;
               // clearInterval(updateIntv);
                $('.jp-play').bind('click.restart', function (e) {
                    e.preventDefault();
                    that.data.tlStep = 0;
                    that.playTimeLine(({init : true}));                                        
                    $('.jp-play').unbind('click.restart');
                });
                
                $('#play-overlay-button').show();
            }
        },
        // @@ thius should go into jp-gui view
        loadMegaTimeLine : function (opts) {
            var that = this,
                data = {},
                comments = [];
                
            data.elems = opts.mediaElements;
            _.each(data.elems, function (elem) {
                elem.width = ((elem.length / that.data.tlLength)*100).toFixed(2);
            });
            console.log(data);
            $('#jp-mega-playbar-container').html(_.template($('#tmp-mega-timeline').html(), data));
//            $('#jp-mega-playbar-container').html("foo");

            $('.mega-timeline .bar .jp-seek-bar').on('click', function (e) {
                e.preventDefault();
                var seekPerc = e.offsetX/($(e.currentTarget).width());
                return false;
            });
            
            this.getMediaElementComments({id : this.model.id, jqEl : "#mega-markers-container", mega : true, timeLineLength : opts.timeLineLength});
        },
        
        
        // @@ should go into comment view and instantiate view as needed
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
            $('#comment-popup-container').empty();
        },
        
        // how many comment markers fit on a timeline?
        calcCommentMarkers : function (opts) {
            var markerArray, numbMarkers, markerSecs,
                that=this,
                playerData = this.$el.jPlayer().data('jPlayer').status;
            
            if (opts && opts.mega === true) {
                numbMarkers = Math.floor($('.mega-timeline .bar').width() / 20); // [width of bar] / [ width of marker+4px ]
                markerSecs = Math.floor(opts.timeLineLength / numbMarkers); // [ length of video ] / [ number of Markers ]
            } else {
                numbMarkers = Math.floor($('.jp-progress').width() / 20); // [width of bar] / [ width of marker+4px ]
                markerSecs = Math.floor(playerData.duration / numbMarkers); // [ length of video ] / [ number of Markers ]
            }
            
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
    
    MegaTimeLineView = PlayListView.extend({
        // return all comments for playlist
        getPlayListComments : function (id) {
            
        },
        
        // initialize with timeline data
        loadMegaTimeLine : function (opts) {
            var that = this,
                data = {},
                comments = [];
            
            // show media segment lengths
            data.elems = opts.mediaElements;
            _.each(data.elems, function (elem) {
                elem.width = ((elem.length / opts.timeLineLength)*100).toFixed(2);
            });
            $('#mega-container').html(_.template($('#tmp-mega-timeline').html(), data));
            this.getMediaElementComments({id : this.model.id, jqEl : "#mega-markers-container", mega : true, timeLineLength : opts.timeLineLength});
        },
        
    });
    
    /**
     * Viddler wrapper around jPlayer
     **/
    VPlayerView = Backbone.View.extend({
        el : '#jquery_jplayer_1',
        
        loadVPlayerGui : function (opts) {
            var that = this;
            this.setElement('.jp-gui'); 
            this.$el.html(_.template($('#tmp-mega-gui').html()));

//            $('.jp-gui').html(_.template($('#tmp-mega-gui').html()));
            //this.$el.html(_.template($('#tmp-mega-gui').html()));
            this.$('.jp-comment').on('click', function () {
                that.loadCommentPopUp();
            });
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
                    console.log(that.$el.jPlayer());
                },
                swfPath: "../js/vendor",
                supplied: "m4v, ogv",
                errorAlerts : true
            });
        },
        
        // wrap funs in player ready
        onPlayerReady : function (func, context) {
            if (DEBUG) console.log('v player ready call');
            $(this.el).on($.jPlayer.event.ready, func());
        },
        
        // wrap functions in can play
        onCanPlay : function (context, func) {
            if (DEBUG) console.log('v can Play call');
            $(this.el).on($.jPlayer.event.canplay, func(context));
            // works in webkit only?
        }
    });
    
    // add controls for modals here
    VPlayerGui = Backbone.View.extend({
        el : ".jp-gui",
        
        events : {
            'click .jp-comment' : 'commentModal'
        },
        
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
        
        render : function(opts) {
            //this.$el.html("GUI here");
            this.$el.html(_.template($('#tmp-mega-gui').html()));
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
        events : {
            'click #comment-form-submit' : 'commentSubmit',
        },
        
        initialize : function (opts) {
            this.__init(opts);
            _.bindAll(this, 'commentSubmit');
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
            this.$el.html(this.template(this.data));
            $('.comment-close').on('click', function (e) {
                e.preventDefault();
                $('#modal-outer').hide();
                return false;
            });
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
            var that = this;
            this.setElement('.jp-gui'); 
            this.$el.html(_.template($('#tmp-jplayer-gui').html()));
            this.loadJPlayer();
        },
        
        onPlayerReady : function () {
            var that = this;
            
            that.$el.jPlayer('setMedia', {m4v : "http://www.jplayer.org/video/m4v/Big_Buck_Bunny_Trailer_480x270_h264aac.m4v"})
            $('.jp-play').on('click.init', function (e) {
                e.preventDefault();
                that.$el.jPlayer("play", 7);
                $('.jp-play').unbind('click.init');
            });
        },
        
        loadJPlayer : function (opts) {
            var that = this;
            this.setElement('#jquery_jplayer_1');
            this.$el.jPlayer({
                ready: function () {
                    // bind events once player is ready
          
                    that.onPlayerReady();
                },
                swfPath: "../js/vendor",
                supplied: "m4v, ogv",
                errorAlerts : true
            });
        },
    });
    
})(jQuery);