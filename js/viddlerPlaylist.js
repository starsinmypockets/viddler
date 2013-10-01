var ViddlerPlaylist = ViddlerPlaylist || {};

/**
   * Setup the global playlist manager object.
   */
ViddlerPlaylist.playlistUrl = playerOptions.opts.playlistUrl;

Playlist = Backbone.Model.extend({});

ViddlerPlaylist.Playlist = Playlist;
