define(function() {

  return {

    extensions : {
      'googleanalytics' : 'extensions/googleanalytics/googleanalytics-main',
      'liverail' : 'extensions/liverail/liverail-main',
      'sitecatalyst' : 'extensions/sitecatalyst/sitecatalyst-main'
    },

    plugins : {

      //'jplayer' : 'plugins/jplayer/jplayer-plugin',
      //'comments' : 'plugins/comments/comments-plugin'
      //'plaincontent' : 'plugins/plaincontent/plaincontent-plugin',

      'popcornjs' : 'plugins/popcornjs/popcornjs-main',
    },

    ga_account : '',

    // These will need to be populated by the api
    lr_video_id : 'asdf1234',
    lr_title : 'Big Buck Bunny',

    // LiveRail pre-roll on all clips
    lr_preroll : true,

    davis : {
      raiseErrors : true,
      generateRequestOnPageLoad: true
    }

  };
    
});