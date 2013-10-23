(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');


if(config.gaAccountId) {

	ga('create', config.gaAccountId);

} else {

	// Google Analytics for localhost
	ga('create', 'UA-XXXX-Y', {
	  'cookieDomain': 'none'
	});

}

ga('send','pageview');

app.Tracker.addPageTrackFunction(function(req) {
	ga('send', 'pageview', req.fullPath)
});

app.Tracker.addEventTrackFunction(function(event) {
	ga('send', 'event', event.category, event.action, event.label, event.value);
});