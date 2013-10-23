// All sorts of initialization here

var app = app || {};

// Copy configuration values
app.Config = config || {};

// Tracker object. Page tracking plugins add functions here and the router calls trackPage()
app.Tracker = {};

// Davisjs Router
app.Router = {};

// Initializing config values for plugins
for (var key in app.Config.plugins) {
   
   var initConfigFn = app.Config.plugins[key];
   
   initConfigFn();
   
   $.getScript( "../js/plugins/" + key + "/" + key + "-plugin.js", function( data, textStatus, jqxhr ) {
   		if(jqxhr.status == 200) {
			console.log( "[Plugin] Loaded: " + key );
   		} else {
   			console.log( "[Plugin] Failed: " + key );	   			
   		}
	});

}
