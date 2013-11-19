// Adds support for subtitles and sprites

if(Modernizr.video) {


define(['underscore', 'viddler-events', 'plugins/popcornjs/popcorn-complete'], function(_, Events) {

  var pop;

  Events.on('playerReady', function (that) {
    if (Modernizr.video.h264 && Popcorn) pop = Popcorn("#jp_video_0");
  });

  Events.on('timelineStep:subtitles', function(that, subtitleSrc) {
    if(!pop) return;

    // clear popcorn events from previous step
    if (_.has(pop, 'destroy')) {
        pop.destroy();
    }
    // add subtitles
    pop.parseSRT(subtitleSrc);
  });

  Events.on('timelineStep:sprites', function(that, sprites) {

    function _destroySprite(id) {
    }
    _.each(sprites, function (sprite) {
            // @@ put in Util 
            var spriteId = Math.random().toString(36).substring(7);  // give the sprite a temp id
            pop.cue(sprite.start/1000, function () {
                html = _.template($('#tmp-sprite').html(), {
                    id : spriteId,
                    sprite : sprite.html
                });
                that.$el.append(html).find('.sprite-outer').css({
                    position : "absolute",
                    top : 10,
                    left : 10
                });
                that.$('.modal-close').on('click', function (e) {
                    $(this).parent('.sprite-outer').remove();
                });
            });
            pop.cue(sprite.stop/1000, function () {
                $('*[data-sprite-id="'+spriteId+'"]').remove();
            });
    });

  });
  
  return {
      isView : false;
  }
  console.log( "[Plugin] Loaded: Popcornjs");

});


}
