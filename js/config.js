define(function() {

  return {

    extensions : {
      'googleanalytics' : 'extensions/googleanalytics/googleanalytics-main',
      'sitecatalyst' : 'extensions/sitecatalyst/sitecatalyst-main'
    },

    plugins : {
      //'comments' : 'plugins/comments/comments-plugin'
      'liverail' : 'plugins/liverail/liverail-main',
      'popcornjs' : 'plugins/popcornjs/popcornjs-main'
    },

    players : {
      'm4v' : 'players/jplayer/jplayer-main'
      //,'html' : 'players/markup/markup-main'
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
    },

    DEBUG : true,
    tDEBUG : false // debug timeline clock events
        

  };
    
});