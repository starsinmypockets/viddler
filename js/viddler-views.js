(function ($) {

    window.BaseView = Backbone.View.extend({
        id : 'content',
        tag : 'div',
        el : '#comments1',
        
        __init : function (opts) {
            this.template = _.template($(opts.tmp).html());
        },
        
        render : function (attrs) {
            this.$el.html(this.template());
            return this;
        },
        
    });
    
    window.CommentView = BaseView.extend({
        initialize : function (opts) {
            this.__init(opts);
            console.log(this.collection);
        },
        
        loadComments : function (opts) {
            var that = this;
            this.collection.fetch({
                success : function (collection, response) {
                     that.collection = collection;
                     that.render();
                },
                error : function (collection, response) {
                    that.render({error : true});
                }  
            });
        },
        
        render : function (opts) {
            data = {};
            data.items = this.collection.toJSON();
            // If error, just load view with no comments
            if (opts && opts.error === true) {
                data.error = true;
                data.items = [];
            }
            this.$el.html(this.template(data));
            return this;
        }
    });
    
    window.PlayListView = BaseView.extend({
        initialize : function (opts) {
            this.__init(opts);
        },
        
        loadPlayList : function (opts) {
            var that = this;
            this.model.fetch({
                success : function (model, response, opts) {
                    that.render();
                },
                error : function (model, response) {
                    console.log(response);
                }
            });
        },
        
        render : function () {
            console.log(this.model);
            data = {};
            data.update = "Update"
            this.$el.html(this.template(data))
        }
    });
})(jQuery);