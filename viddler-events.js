define(['backbone'], function(Backbone) {

  var Events;

  Events = {
    vent: _.extend({}, Backbone.Events),
    queue: {},
      privates: [
          'timelineReady', 'guiReady', 'playerReady',
          'timelineStep', 'timelineInit', 'timelineEnd', 'timelineTick'
      ],

    on: function(eventName, callback) {
      //var q = priority ? hiQueue : loQueue;
      if(this.queue[eventName]) {
        this.queue[eventName].push(callback);
      } else {
        this.queue[eventName] = [callback];
        this.vent.on(eventName, function() {
          Events.process(eventName, arguments);
        });
      }
    },

    once: function(eventName, callback) {
      this.vent.once(eventName, callback);
    },

    process: function(eventName, args) {
      _.each(this.queue[eventName], function(callback) {
        if (typeof callback === "function") {
          callback.apply(callback, args);
        }
      });
    },

    trigger: function(eventName) {
          console.log("[Event] " + eventName);
          // pass all arguments
          this.vent.trigger.apply(this.vent, arguments);
    },

    off: function(eventName) {
      this.vent.off(eventName);
      this.queue[eventName] = undefined;
    }


  }

  // get login view
  Events.on('doLogin', function (e) {
      login = new UserLoginView({
          tmp : '#tmp-user-login-form'
      }).render();
  });

  // get signup view
  Events.on('doSignup', function () {
      login = new UserSignupView({
          tmp : '#tmp-user-signup-form'
      }).render();
  });

  // Unauthorized view
  Events.on('noAuth', function () {
      login = new UserNoAuthView({
          tmp : "#tmp-no-auth-form"
      }).render();
  });

  // do mega timeline seek
  Events.on('click .jp-seek-bar', function (e) {
      console.log('my seek');
  });

  return Events;

});