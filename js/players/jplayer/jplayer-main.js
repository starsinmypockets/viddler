define(['jquery', 'backbone', 'helper/util', 'viddler', 'config', 'jplayer'], function($, Backbone, Util, Viddler, Config) {

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
                          // bind events once player is ready
                          if (Config.DEBUG) {
                              $('#inspector').jPlayerInspector({
                                  jPlayer : $("#jquery_jplayer_1")
                              });
                          }
                          Viddler.Events.trigger("playerReady");
                      },
                      swfPath: "../js/vendor/",
                      supplied: "m4v",
                      backgroundColor: '#grey',
                      errorAlerts : true,
                      solution : "html, flash",
                  };
                  width = this.$el.width();
                  height = this.$el.height();
                  jPData.size= {
                      width : width,
                      height : height
                  }
/*
                  width,
                  height;

                  
              if (Util.ie8) {
                  jPData.size = {
                      width : width,
                      height : height
                  };
              }
*/
              this.$el.jPlayer(jPData);
          },
          
           // Player controls 
           setMedia : function (opts) {
              var data = {},
                  that = this;
                  
              if (!Util.ie8) {
                   $('#load-wait').show();
               }
               data[opts.type] = opts.url;
               this.$el.jPlayer("setMedia", data);
               if (!Util.ie8) {
                   this.$el.on(($.jPlayer.event.canplay), function () {
                       if (Config.DEBUG) console.log("JPLAYER EVENT: canplay");
                       $('#load-wait').hide();
                       Viddler.Events.trigger('mediaReady');
                   });
               } else {
                   if (Config.DEBUG) console.log("IE8 / FF setMedia");
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