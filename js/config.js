var app = app || {};
app.Config = {};

// Define plugins to be used here
// foldername : Display Name
app.Config.plugins = {
	
	googleanalytics : function() {
		// Google Analytics variables
		app.Config.ga_account = "";
	}

	/*
	,sitecatalyst : function() {
		// SiteCatalyst variables
		app.Config.s_account = "";
		app.Config.s_visitorNamespace = "";
		app.Config.s_trackingServer = "";
	}
	*/
	
	,liverail : function() {
		// LiveRail variables
		// These will need to be populated by the api
		app.Config.lr_video_id = "asdf1234";
		app.Config.lr_title = "Big Buck Bunny";
	}
};

// Davis Settings
// http://olivernn.github.io/davis.js/docs/#settings
app.Config.davis = {
	raiseErrors : true,
	generateRequestOnPageLoad : true
};