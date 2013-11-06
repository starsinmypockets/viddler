require.config({

    paths: {
        'jquery': 'lib/jquery',
        'backbone' : 'lib/backbone',
        'underscore' : 'lib/underscore',
        'davis' : 'lib/davis',
        'davis.hashRouting' : 'lib/davis.hashRouting',
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
      }
  
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
//            touchHandlerInit();
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
          
          // shim for mobile touch / drag events
/*
          function touchHandler(event) {
            var touch = event.changedTouches[0];
        
            var simulatedEvent = document.createEvent("MouseEvent");
                simulatedEvent.initMouseEvent({
                touchstart: "mousedown",
                touchmove: "mousemove",
                touchend: "mouseup"
            }[event.type], true, true, window, 1,
                touch.screenX, touch.screenY,
                touch.clientX, touch.clientY, false,
                false, false, false, 0, null);
        
            touch.target.dispatchEvent(simulatedEvent);
            event.preventDefault();
        }

        function touchHandlerInit() {
            document.addEventListener("touchstart", touchHandler, true);
            document.addEventListener("touchmove", touchHandler, true);
            document.addEventListener("touchend", touchHandler, true);
            document.addEventListener("touchcancel", touchHandler, true);
        }
*/

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