rainReady(function(){

    jwplayer('vid-jwplayer1').setup({
        file: '/test/scroll_indicator.mp4',
        plugins: {
            '/js/sprites.js': {
                text: 'Hello world!'
            }
        }
    });

});