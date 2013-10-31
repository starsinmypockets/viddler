(function ($) {
    window.CommentCollection = Backbone.Collection.extend({       
        model: CommentModel,
        media_element : '', // reference comments collection to media_element id
        initialize : function(models, options) {
            this.media_element = options.media_element;
            return this;
        },
        parse : function (response) {
            return response;
        },

        url : function () {
            console.log('../json-examples/comments/'+this.media_element+'/comments2.json');
            return '../json-examples/comments/'+this.media_element+'/comments2.json';
        }
    });
})(jQuery);