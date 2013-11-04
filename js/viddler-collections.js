define(['backbone', 'viddler-models'], function(Backbone, Models) {

    var Collections = {};

    Collections.CommentCollection = Backbone.Collection.extend({       
        model: Models.CommentModel,
        media_element : '',
        initialize : function(models, opts) {
            this.media_element = opts.media_element;
            return this;
        },
        parse : function (response) {
            return response;
        },

        url : function () {
            return '../json-examples/comments/'+this.media_element+'/comments2.json';
        },
        
        getByTimeRange : function (opts) {
            var items = [];
            _.each(this.models, function (model) {
                if (model.attributes.time >= opts.start && model.attributes.time < opts.stop) {
                    items.push(model);
                }
            });
            return items;
        }
    });

    return Collections;

});
