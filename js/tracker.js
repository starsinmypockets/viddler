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