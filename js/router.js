var App = App || {};

App.Router = Davis(function() {
	

	this.configure(function () {

		for (var key in App.Config.davis) {		   
		   this[key] = App.Config.davis[key];
		}

	});


	// runs once, before the first route is processed
	this.bind('start', function(req) {
		rainReady(function(){

		    console.log('rainReady');
		    $('.user-login').on('click', function () {ViddlerPlayer.vent.trigger('doLogin')});
		    $('.user-signup').on('click', function () {ViddlerPlayer.vent.trigger('doSignup')});
		    $('.no').on('click', function () {ViddlerPlayer.vent.trigger('noAuth')});
		   
		   /* Session Authentication */
		    var $doc = $(document);
		    
		    $doc.ajaxSend(function (event, xhr) {
		        var authToken = $.cookie('access_token');
		        if (authToken) {
		            xhr.setRequestHeader("Authorization", "Bearer " + authToken);
		        }
		    });

		    $doc.ajaxError(function (event, xhr) {
		        if (xhr.status == 401)
		            ViddlerPlayer.vent.trigger('noAuth');
		    });

		});

	});


	// client-side 404
	this.bind('routeNotFound', function(req) {
		console.log("Route not found -- " + req.fullPath);
	});


	// Fires before every route
	this.before(function() { 
		// TODO: cleanup views and events
	});

	this.after(function(req) {
		App.Tracker.trackPage(req);
	});



	// Routes
	this.get('/skin/(.*)', function(req) {
		window.testInit();
	});

	this.state('/skin/record', function(req) {
		console.log('record route');
	});
});

App.Plugins.init();