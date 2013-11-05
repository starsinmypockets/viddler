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


  return Events;

});