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
		for (var key in app.Config.plugins) {
		   
		   var initConfigFn = app.Config.plugins[key];
		   
		   initConfigFn();

		   LazyLoad.js("../js/plugins/" + key + "/" + key + "-plugin.js", function(pluginName) {
				console.log( "[Plugin] Loaded: " + pluginName );
		   }, key);

		}
	}

};