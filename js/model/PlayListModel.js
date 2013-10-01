var ViddlerPlaylist = ViddlerPlaylist || {};

/**
  * Setup the global playlist manager object.
  */
ViddlerPlaylist.playlistUrl = PlayerOptions.opts.playlistUrl;

PlaylistModel = Backbone.Model.extend({
	defaults: {
		Id : '',
		title : ''
	}
	initialize: function () {
		this.fetch()
	},
	url : function () {
		var base = ''
	}

});

ViddlerPlaylist.Playlist = PlaylistModel;
