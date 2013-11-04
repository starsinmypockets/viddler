define(['require', 'underscore', 'config', 
  'viddler-player', 
  'viddler-models', 
  'viddler-views', 
  'viddler-collections',
  'viddler-events',
  'viddler-manager'], function(require, _, Config) {

  var Viddler = {
    Player : require("viddler-player"),
    Events : require("viddler-events"),
    Models : require("viddler-models"),
    Views: require("viddler-views"),
    Collections: require("viddler-collections"),
    Manager: require("viddler-manager"),
    
    trackPage : function(req) {
      this.Events.trigger('tracking:pageview', req);
    },
    trackEvent : function(event) {
      this.Events.trigger('tracking:event', event);
    }

  };

  // Dynamic require used to load plugins defined in Config
  require(_.values(Config.plugins), function () {
    Viddler.Plugins = _.object(_.keys(Config.plugins), arguments);
  });

  require(_.values(Config.extensions), function () {
    Viddler.Extensions = _.object(_.keys(Config.extensions), arguments);
  });

  return Viddler;
    
});