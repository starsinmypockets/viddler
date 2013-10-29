var App = App || {};

Davis.extend(Davis.hashRouting({ prefix: "!" }));
App.Router = new Davis.App;
App.Router.configure(function () {

	for (var key in App.Config.davis) {		   
	   this[key] = App.Config.davis[key];
	}

});


App.Router.bind('start', function(req) {
	rainReady(function() {
        console.log('rainReady');
        $('.user-login').on('click', function (e) {
            e.preventDefault();
            ViddlerPlayer.vent.trigger('doLogin');
            return false;
        });
        $('.user-signup').on('click', function (e) {
            e.preventDefault();
	        ViddlerPlayer.vent.trigger('doSignup');
	        return false;
	    });
        $('.no').on('click', function (e) {
            e.preventDefault();
	        ViddlerPlayer.vent.trigger('noAuth');
	        return false;
	    });
    	    
       /* Session Authentication */
        var $doc = $(document);

        $doc.ajaxError(function (event, xhr) {
            if (xhr.status == 401)
                ViddlerPlayer.vent.trigger('noAuth');
        });
	});

});


// client-side 404
App.Router.bind('routeNotFound', function(req) {
	console.log("Route not found -- " + req.fullPath);
});


// Fires before every route
App.Router.before(function() { 
	// TODO: cleanup views and events
});

App.Router.after(function(req) {
	App.Tracker.trackPage(req);
});



// Routes
App.Router.get('(.*)', function(req) {
	window.testPlayer2();
});

App.Router.state('/record', function(req) {
	console.log('record route');
});
