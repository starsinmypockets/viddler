var app = Davis(function() {
	
	this.configure(function () {
          this.raiseErrors = true;
          this.generateRequestOnPageLoad = true;
	});

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

	this.bind('routeNotFound', function(route) {
		console.log(route);
	});

	this.before(function() {
		// TODO: cleanup
	});

	this.get('/skin/(.*)', function(req) {
		window.testInit();
	});

	this.state('/skin/*index/record', function(req) {
		console.log('/skin/*index/record');
	});
});

app.start();