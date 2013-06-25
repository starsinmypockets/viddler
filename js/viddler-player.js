rainReady(function(){
   	jwplayer("vid-jwplayer1").setup({
        file: "../test/scroll_indicator.mp4",
        height: 360,
        image: "../test/scroll_indicator.png",
        width: 640,
        tracks: [
	        { 
	            file: "/test/thumbnails.vtt", 
	            kind: "thumbnails"
	        },
	        { file: "../test/captions.vtt", kind: "subtitles", label: "English"}
        ]
    });


});