var app = Davis(function() {
	

	this.configure(function () {
          this.raiseErrors = true;
          this.generateRequestOnPageLoad = true;
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
	this.bind('routeNotFound', function(route) {
		console.log("Route not found --");
		console.log(route);
	});


	// Fires before every route, TODO: cleanup views and events
	this.before(function() { });

	this.after(function(req) {
		app.track('send', 'pageview', req.fullPath);
	});



	// Routes
	this.get('/skin/(.*)', function(req) {
		window.testInit();
	});

	this.state('/skin/record', function(req) {
		console.log('record route');
	});
});

app.googleAnalyticsLoaded = 
app.track = function() {
	
	if(typeof window.ga != undefined) {
		ga.apply(this, arguments);
	}

};

app.start();