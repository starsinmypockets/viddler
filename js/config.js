// Loaded in the document <head> before app.js
var App = App || {};
App.Config = {};

// Define plugins to be used here
// foldername : Display Name
App.Config.plugins = {
	
	googleanalytics : function() {
		// Google Analytics variables
		App.Config.ga_account = "";
	}

	/*
	,sitecatalyst : function() {
		// SiteCatalyst variables
		App.Config.s_account = "";
		App.Config.s_visitorNamespace = "";
		App.Config.s_trackingServer = "";
	}
	*/
	
	,liverail : function() {
		// LiveRail variables
		// These will need to be populated by the api
		App.Config.lr_video_id = "asdf1234";
		App.Config.lr_title = "Big Buck Bunny";
	}
};

// Davis Settings
// http://olivernn.github.io/davis.js/docs/#settings
App.Config.davis = {
	raiseErrors : true,
	generateRequestOnPageLoad : true
};