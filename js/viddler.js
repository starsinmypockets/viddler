define(['require', 'underscore', 'config', 
  'viddler-models', 
  'viddler-views', 
  'viddler-collections',
  'viddler-events',
  'viddler-manager'], function(require, _, Config) {

  var Viddler = {
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

  // get login view
  Viddler.Events.on('doLogin', function (e) {
      login = new Viddler.Views.UserLoginView({
          tmp : '#tmp-user-login-form'
      }).render();
  });

  // get signup view
  Viddler.Events.on('doSignup', function () {
      login = new Viddler.Views.UserSignupView({
          tmp : '#tmp-user-signup-form'
      }).render();
  });

  // Unauthorized view
  Viddler.Events.on('noAuth', function () {
      login = new Viddler.Views.UserNoAuthView({
          tmp : "#tmp-no-auth-form"
      }).render();
  });

  // do mega timeline seek
  Viddler.Events.on('click .jp-seek-bar', function (e) {
      console.log('my seek');
  });

  return Viddler;
    
});