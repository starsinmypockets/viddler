(function ($) {
    window.CommentCollection = Backbone.Collection.extend({       
        model: CommentModel,
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
            var models = [];
            console.log(this);
            _.each(this.models, function (model) {
                console.log(model);
                if (model.attributes.time >= opts.start && model.attributes.time <= opts.stop) {
                    models.push(model);
                }
            });
            console.log(models);
            return models;
        }
    });
})(jQuery);