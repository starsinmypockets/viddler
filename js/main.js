require.config({
  
  baseUrl: '../js',
    
    paths: {
        'jquery': 'lib/jquery',
        'backbone' : 'lib/backbone',
        'underscore' : 'lib/underscore',
        'davis' : 'lib/davis',
        'davis.hashRouting' : 'lib/davis.hashRouting',
        'jplayer' : 'lib/jquery.jplayer.min',
        'jplayer.inspector' : 'lib/jquery.jplayer.inspector',
        'rain_lib' : 'lib/rain_lib'
    },

    shim: {

      'backbone': {
          deps: ['underscore', 'jquery'],
          exports: 'Backbone'
      },

      'davis': {
        deps: ['jquery'],
        exports: 'Davis'
      },
      'davis.hashRouting' : ['davis'],
      
      'underscore': {
          exports: '_'
      },

      'rain_lib' : {
        exports: 'rainReady'
      },

      // jQuery plugins
      'jplayer' : ['jquery'],
      'jplayer.inspector' : ['jquery']
  
  }

});

require(['config', 'viddler', 'rain_lib', 'davis', 'jquery', 'davis.hashRouting'], function(Config, Viddler, rainReady, Davis, $) {

  $(window).on('resize', function () {
      var height = $('#jp_container_1').width()*.6;
      $('#jquery_jplayer_1').css({
          'min-height' : height
      });
  }).resize();

  Davis.extend(Davis.hashRouting({ prefix: '!' }));

  Viddler.Router = Davis(function() {

    this.configure(function () {

      for (var key in Config.davis) {      
         this[key] = Config.davis[key];
      }

    });

    this.bind('start', function(req) {
              
      rainReady(function() {
            console.log('rainReady');

            // Dynamic require used to load plugins defined in Config
            require(_.values(Config.plugins), function () {
              Viddler.Plugins = _.object(_.keys(Config.plugins), arguments);
            });

            // extensions
            require(_.values(Config.extensions), function () {
              Viddler.Extensions = _.object(_.keys(Config.extensions), arguments);
            });

            $('.user-login').on('click', function (e) {
                e.preventDefault();
                Viddler.Events.trigger('doLogin');
                return false;
            });
            $('.user-signup').on('click', function (e) {
                e.preventDefault();
              Viddler.Events.trigger('doSignup');
              return false;
          });
            $('.no').on('click', function (e) {
                e.preventDefault();
              Viddler.Events.trigger('noAuth');
              return false;
          });
              
           /* Session Authentication */
            var $doc = $(document);

            $doc.ajaxError(function (event, xhr) {
                if (xhr.status == 401)
                    Viddler.Events.trigger('noAuth');
            });
      });

    });


    // client-side 404
    this.bind('routeNotFound', function(req) {
      console.log('Route not found -- ' + req.fullPath);
    });


    // Fires before every route
    this.before(function() { 
      // TODO: cleanup views and events
    });

    this.after(function(req) {
      Viddler.trackPage(req);
    });

    // Routes
    this.get('(.*)', function(req) {
      var test = new Viddler.Views.PlaylistView({
          model : new Viddler.Models.PlayListModel({
              id : 2342213
          })
      });
    });

    this.state('/record', function(req) {
      console.log('record route');
    });   


  });

});