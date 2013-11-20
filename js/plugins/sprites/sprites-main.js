define(['jquery', 'backbone', 'helper/util', 'viddler', 'config',
  'players/jplayer/jquery.jplayer.min', 'players/jplayer/jquery.jplayer.inspector'], 
  function($, Backbone, Util, Viddler, Config) {
    console.log(Viddler.Manager.pluginLoaded('sprites'));
    console.log( "[Plugin] Loaded: Sprites");
    return {};
  });