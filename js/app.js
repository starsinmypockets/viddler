// All sorts of initialization here
// This script is loaded in the document <head> and only contains objects and methods that must be immediately available
var App = App || {};

App.init = function() {
	App.Plugins.init();
}

// Tracker object. Page tracking plugins add functions here and the router calls trackPage()
App.Tracker = {

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

App.Plugins = {

	// Loads plugin scripts in the document <head>

	init: function () {
		// Initializing config values for plugins
		var pluginScripts = [];


		for (var key in App.Config.plugins) {
		   
		   var initConfigFn = App.Config.plugins[key];
		   
		   initConfigFn();
		   pluginScripts.push("../js/plugins/" + key + "/" + key + "-plugin.js");

		}

		LazyLoad.js(pluginScripts, function() { 
			console.log( "[Plugin] All plugins loaded." );
			App.Router.start();
		});
	}

};
