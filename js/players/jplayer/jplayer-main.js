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
  }

  return {

    View : Viddler.Views.BaseView.extend({
          timeListenerIntv : {},
          stopListenerIntv : {},
          
          el : '#jquery_jplayer_1',
          mediaEl : {}, // the currently loaded media element
          initialize : function (opts) {
              this.__init(opts);
              this.mediaEl = opts.mediaEl;
          },
          
          clearGuiTime : function () {
              $('.viddler-current-time').html(Util.secs2time(Math.floor(0)));  
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
                      Viddler.Manager.tlNow = parseInt(that.$el.jPlayer().data().jPlayer.status.currentTime*1000 + Viddler.Manager.tlElapsed - that.mediaEl.playheadStart, 10);
                      if ((that.$el.jPlayer().data().jPlayer.status.currentTime*1000)-that.mediaEl.playheadStart >= that.mediaEl.length) {
                          if (Config.DEBUG) console.log("[Player]Clear Time Listener Interval");
                          clearInterval(that.timeListenerIntv);
                      }
                      timeLinePercent = (Viddler.Manager.tlNow / Viddler.Manager.tlLength);
                      playBarWidth = timeLinePercent*$('.jp-progress').width();
                      
                      if (Config.tDEBUG ) {
                          console.log('[Player]step: '+Viddler.Manager.tlStep);
                          console.log('[Player]current: '+Viddler.Manager.tlNow);
                          console.log('[Player]elapsed: '+Viddler.Manager.tlElapsed);
                          console.log('[Player]playheadStart: '+that.mediaEl.playheadStart);
                          console.log('[Player]total: '+Viddler.Manager.tlLength);
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
                      if (Viddler.Manager.tlNow > 0) {
                          $('.viddler-current-time').html(Util.secs2time(Math.floor(Viddler.Manager.tlNow/1000)));
                      }
                      if (Viddler.Manager.tlNow > Viddler.Manager.tlLength) {
                          $('.viddler-current-time').html(Util.secs2time(Math.floor(Viddler.Manager.tlLength/1000)));                        
                      }
                  },1000);  // run this faster in production
          },
          
          // listen for global step end time 
          runStopListener : function () {
              var that = this;
              if (Config.DEBUG) console.log('[Player] stoplistener stop time', Viddler.Manager.stepStop);
              this.stopListenerIntv = setInterval(function() {
                 if (that.$el.jPlayer().data().jPlayer.status.currentTime > Viddler.Manager.stepStop/1000) {
                    if (Config.DEBUG) console.log('stop listener stop');
                    clearInterval(that.stopListenerIntv);
                    // do we need to clear the time listener?
                    clearInterval(that.timeListenerIntv);
                    Viddler.Events.trigger('stopListenerStop');
                 }
              },1000);
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
                          Viddler.Events.trigger("playerReady", that);
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
/*
                      width : width,
                      height : height
*/
                  }
              this.$el.jPlayer(jPData);
          },
          
           // Player controls 
           setMedia : function (opts) {
              var data = {},
                  that = this;
                  
               if (!Util.ie8 & !navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                   $('#load-wait').show();
               }
               data[opts.type] = opts.url;
               if (opts.poster) data.poster = opts.poster;
               this.$el.jPlayer("setMedia", data);
               if (!Util.ie8) {
                    // @@ this never gets called in ios
                   this.$el.on(($.jPlayer.event.canplay), function () {
                       if (Config.DEBUG) console.log("JPLAYER EVENT: canplay");
                       $('#load-wait').hide();
                       Viddler.Events.trigger('mediaReady');
                   });
               } else {
                   if (Config.DEBUG) console.log("IE8 / FF setMedia");
                   $('#load-wait').hide();
                   Viddler.Events.trigger('mediaReady');
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
      })

  }

});