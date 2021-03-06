define(['jquery', 'backbone', 'helper/util', 'viddler', 'config',
  'players/jplayer/jquery.jplayer.min', 'players/jplayer/jquery.jplayer.inspector'], 
  function($, Backbone, Util, Viddler, Config) {

  //  
  /* TRACKING events */
  //
  var bindEvents = function(el) {
    el.on($.jPlayer.event.play, function(event) {
       var playerTime = Math.round(event.jPlayer.status.currentPercentAbsolute);
       var mediaName = event.jPlayer.status.src;
        Viddler.Events.trigger('tracking:event', {
          category:'jPlayer', 
          action: 'Play',
          label: mediaName,
          value: playerTime
        });
    });

    //listener for a pause click
    el.on($.jPlayer.event.pause, function(event) {
      var playerTime = Math.round(event.jPlayer.status.currentPercentAbsolute);
      var mediaName = event.jPlayer.status.src;
      //We’ll only track the “pause” if the percent value is less than 100. This is because at 100%
      //when the player ends, it will send a pause event with the end event.
      //we don’t need that duplication in GA
      if(playerTime<100){
        Viddler.Events.trigger('tracking:event', {
          category:'jPlayer', 
          action: 'Pause',
          label: mediaName,
          value: playerTime
        });
      }
    });

    //listening for the user dragging the seek bar
    el.on($.jPlayer.event.seeking, function(event) {
      var playerTime = Math.round(event.jPlayer.status.currentPercentAbsolute);
      var mediaName = event.jPlayer.status.src;
      Viddler.Events.trigger('tracking:event', {
        category:'jPlayer', 
        action: 'Seeking',
        label: mediaName,
        value: playerTime
      });
    });

    //listening for when the user has stopped dragging the seek bar
    el.on($.jPlayer.event.seeked, function(event) {
     var playerTime = Math.round(event.jPlayer.status.currentPercentAbsolute);
     var mediaName = event.jPlayer.status.src;
     
     //There’s some overlap between the seeked and stopped events. When a user clicks
     // the stop button it actually sends a “seek” to the 0 location. So if the seeked location is 0
     // then we track it as a stop, if it’s greater than 0, it was an actual seek.
     if(playerTime>0){
        Viddler.Events.trigger('tracking:event', {
          category:'jPlayer', 
          action: 'Seeked',
          label: mediaName,
          value: playerTime
        });
     } else {
        Viddler.Events.trigger('tracking:event', {
          category:'jPlayer', 
          action: 'Stopped',
          label: mediaName,
          value: playerTime
        });
     }
    });
    
    //listening for an end ie file completion
    el.on($.jPlayer.event.ended, function(event) {
      var playerTime = 100;
      var mediaName = event.jPlayer.status.src;
      Viddler.Events.trigger('tracking:event', {
        category:'jPlayer', 
        action: 'Ended',
        label: mediaName,
        value: playerTime
      });
    });
    
    el.on($.jPlayer.event.canplay, function (event) {
        var mediaName = event.jPlayer.status.src;
        Viddler.Events.trigger('tracking:canplay', {
            category:'jPlayer',
            action:'Can Play',
            label:mediaName,
            value:true
        });
    });
  }

  return {
    View : Viddler.Views.BaseView.extend({
          timeListenerIntv : {},
          jPlayerData : {},
          // @@ TODO  this should be defined in config.js
          el : '#jquery_jplayer_1',
          // @@ TODO this too
          mediaEl : {}, // the currently loaded media element
          pluginData : {},
          
          initialize : function (opts) {
                console.log('init', opts);
              var that = this;
              this.__init(opts);
              this.loadPlayer();
              this.pluginData = opts.pluginData;
              this.jPlayerData = this.$el.jPlayer().data().jPlayer.status;
              this.mediaEl = Viddler.Manager.getCurrentMedia();              
              this.updatePlayerControls();
              this.addEventListeners();
              Viddler.Manager.pluginLoaded('jPlayer');
              if (Config.DEBUG) console.log('[jplayer]: instantiated');
          },
          
          // @@ we could subclass this for convenience
          // @@ & write noops that plugins could override
          // map event hooks to plugin methods
          addEventListeners : function () {
              var that = this;
              Viddler.Events.on('jplayer:ready', function () {that.onPlayerReady()});
              Viddler.Events.on('timeline:clickStart', function () {that.onTimelineClickStart()});
              Viddler.Events.on('timeline:stepStart', function () {that.onStepStart()});
              Viddler.Events.on('timeline:stepEnd', function () {that.onStepEnd()});
              Viddler.Events.on('timeline:timelineEnd', function () {that.onTimelineEnd()});
          },
          
          // take over the player controls
          updatePlayerControls : function () {
              var that = this;
              $('.jp-play, #play-overlay-button').bind('click.init', function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                $('#play-overlay-button').hide();
                that.play();
                $('.jp-play').unbind('click.init');
                return false;
            });
          },
          
          onPlayerReady : function () {
              this.setMedia(this.pluginData);
          },
          
          onStepStart : function () {
                           
              var that = this,
                  step = Viddler.Manager.getCurrentStep();
              clearInterval(this.timeListenerIntv);
              this.runTimeListener();
              console.log('step start');
              if (step === 0)  $('#play-overlay-button').show();
              // autoplay on steps after the first
              if (step > 0) {
                  Viddler.Events.on('mediaReady', function () {
                      console.log('stepStart media ready');// get playhead start
                      that.play();
                  });
              }
          },
          
          onStepEnd : function () {
             // clearInterval(this.timeListenerIntv);
          },
          
          onTimelineClickStart: function () {
              //this.play();
          },
          
          // do cleanup / teardown
          onTimelineEnd : function () {
              console.log('jplayer end hook');
              this.stop();
              clearInterval(this.timeListenerIntv);
          },
          
          // update app with current step time
          runTimeListener : function (opts) {
              console.log('hit timelist');
              var that = this,
                  timeLinePercent,
                  playBarWidth;
                  
              this.timeListenerIntv = setInterval(function() {
                  var t = that.$el.jPlayer().data().jPlayer.status.currentTime*1000;
                  console.log(t, that.$el.jPlayer().data().jPlayer.status);
                  Viddler.Manager.setTime(t)
              },100);  // run this faster in production
          },
          
          loadPlayer : function (opts) {
              var that = this,
                  width,
                  height,
                  jPData = {
                      ready: function () {
                          var w;
                          if (Config.DEBUG) {
                              $('#inspector').jPlayerInspector({
                                  jPlayer : $("#jquery_jplayer_1")
                              });
                          }
                          w =  that.$el.width();
                          that.$('video, object').css({
                              'width' : w,
                              'min-height' : w*.56
                          });
                          bindEvents($(that.el));
                          Viddler.Events.trigger("jplayer:ready", that);
                      },
                      swfPath: "swf",
                      supplied: "m4v",
                      backgroundColor: '#grey',
                      errorAlerts : true,
                      solution : "html, flash",
                  };
                  width = this.$el.width();
                  height = this.$el.height();
                  jPData.size= {
                      width: "100%",
                      height: "auto"
                  }
              this.$el.jPlayer(jPData);
          },
          
           // Player controls 
           setMedia : function (opts) {
              var data = {},
                  that = this;
                console.log('setMedia', opts);
               data[opts.elementType] = opts.elementURL;
               if (opts.poster) data.poster = opts.poster;
               this.$el.jPlayer("setMedia", data);
               
               if (!Util.matrix.flashBrowser && !Util.matrix.ios) {
                   $('#load-wait').show();
                   Viddler.Events.on(('tracking:canplay'), function () {
                       if (Config.DEBUG) console.log("[jplayer] canplay event");
                       $('#load-wait').hide();
                       Viddler.Events.trigger('mediaReady');
                   });
                   return;
               }
              // $('#load-wait').hide();
              // Viddler.Events.trigger('mediaReady');
           },
           
           play : function (opts) {
               var that = this;
               (opts && opts.start) ? start = opts.start : start = '';
               this.$el.jPlayer("play", start);
           }, 
           
           stop : function () {
               this.$el.jPlayer("stop");
           },
           
           pause : function () {
               this.$el.jPlayer("pause");
           }
      })

  }
});