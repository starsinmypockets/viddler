// This file is for scripts that need to run before the closeing </head> tag
// Originally created for analytics initialization

/* Google Analytics */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-XXXX-Y', {
  'cookieDomain': 'none'
});

ga('send','pageview');

/* End Google Analytics */

//

/* SiteCatalyst code version: H.22.1. */
/* Commented out until we get an s_code
s.pageName="Product List Page"
s.server=""
s.channel="Women's Dept"
s.pageType=""
s.prop1="Activewear"
s.prop2=""
s.prop3=""
s.prop4=""
s.prop5=""
// Conversion Variables
s.campaign=""
s.state=""
s.zip=""
s.events=""
s.products=""
s.purchaseID=""
s.eVar1=""
s.eVar2=""
s.eVar3=""
s.eVar4=""
s.eVar5=""

var s_code=s.t();if(s_code)document.write(s_code);
*/
/* End SiteCatalyst */