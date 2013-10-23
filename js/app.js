// All sorts of initialization here
var app = app || {};

// Tracker object. Page tracking plugins add functions here and the router calls trackPage()
app.Tracker = {

	pageTrackFunctions : [],
	
	eventTrackFunction : [],
	
	addPageTrackFunction : function(func) {
		this.pageTrackFunctions.push(func);
	},
	
	addEventTrackFunction : function(func) {
		this.eventTrackFunction.push(func);
	},
	
	trackPage : function(req) {
		for (i = 0; i < this.pageTrackFunctions.length; ++i) {
            try { this.pageTrackFunctions[i](req); } catch (e) { }
        }
	},
	
	trackEvent : function(event) {
		for (i = 0; i < this.eventTrackFunction.length; ++i) {
            try { this.eventTrackFunction[i](event); } catch (e) { }
        }
	}
	
};

app.Plugins = {

	init: function () {
		// Initializing config values for plugins
		var pluginScripts = [];


		for (var key in app.Config.plugins) {
		   
		   var initConfigFn = app.Config.plugins[key];
		   
		   initConfigFn();
		   pluginScripts.push("../js/plugins/" + key + "/" + key + "-plugin.js");

		}

		LazyLoad.js(pluginScripts, function() { 
			console.log( "[Plugin] All plugins loaded." ); 
		});
	}

};