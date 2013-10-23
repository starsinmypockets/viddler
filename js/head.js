if(config.plugins) {

	for (var key in config.plugins) {
	   var initFn = config.plugins[key];
	   initFn();
	   $.getScript( "../js/plugins/" + key + "/" + key + "-plugin.js", function( data, textStatus, jqxhr ) {
	   		if(jqxhr.status == 200) {
				console.log( "[Plugin] Loaded: " + key );
	   		} else {
	   			console.log( "[Plugin] Failed: " + key );	   			
	   		}
		});
	}

}