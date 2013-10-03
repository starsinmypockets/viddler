(function ($) {
    /* Abstract */
    window.BaseView = Backbone.View.extend({
        id : 'content',
        tag : 'div',
        el : '<br/>',
        vent : {},
        
        // define global events here
        events : {
            'click .bar' : 'test'   
        },
        
        test : function () {
            this.vent.trigger('test');  
        },
        
        __init : function (opts) {
            _.bindAll(this, 'test');
            this.vent = opts.vent; 
            this.template = _.template($(opts.tmp).html());
        },
        
        initialize : function (opts) {
            this.__init(opts);
        },
        
        render : function (attrs) {
            this.$el.html(this.template());
            return this;
        },
        
    });
    
    window.PlayListView = BaseView.extend({
        jPlayer : '',
        playheadPost : '',
        currentMediaElement : '',
        // set player element
        
        events : {
            'click' : 'getCommentModal'
        },
        
        initialize : function (opts) {
            this.__init(opts);
            this.getJPlayer(opts.playerOpts);
            _.bindAll(this, 'getCommentModal');
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
        
        // instantiate jPlayer
        getJPlayer : function (opts) {
            this.jPlayer = this.$el.jPlayer({
                
            });
            return this;
        },
        
        renderPlayer : function (opts) {
            
        },
        
        renderControls : function (opts) {},
        
        loadComments : function (opts) {},
        
        updateComments : function (opts) {},  // on playhead timed event
        
        renderComments : function (opts) {},  
        
        addComment : function (opts) {},
        
        render : function () {
            data = {};
            data.update = "Update"
            this.$el.html(this.template(data))
        },
        
        getCommentModal : function (opts) {
            console.log('Hey!');
        }
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
})(jQuery);