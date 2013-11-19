define(['viddler-events'], function(Events) {
   
   // manage global timeline events
    var Manager = {
            tlStep : 0,
            tlSteps :0,
            tlLength : 0,
            tlElapsed : 0,
            tlNow : 0,
            timeline : {},
            mediaEls : {},
            tlComments : {},
            tlIndex : {},
            
            destroy : function () {
                this.tlStep = 0;
                this.tlSteps = 0;
                this.tlLength = 0;
                this.tlElapsed = 0;
                this.tlNow = 0;
                this.timeline = {};
                this.mediaEls = {};
                this.tlComments = {};
                this.tlIndex = {};
            },
            
            // reinitialize timeline
            tlReset : function () {
                this.tlStep = 0;
                this.tlElapsed = 0;
                this.tlNow = 0;
            },
            
            setMediaEls : function (els) {
                this.mediaEls = els;
                this._initTlIndex();  // add some useful data to the manager object
            },
            
            // @param t - time in ms relative to current step start time
            setTime : function (t) {
                data = {};
                data.tlNow = this._getTlElapsed() + t;
                data.tlNow = t;
                this._updateTime(t);
            },
            
            _updateTime : function (t) {
                Events.trigger('timeline:timeUpdate', t);
                this.tlNow = t;
            },
            
            getCurrentStep : function () {
                return this.tlStep;
            },
            
            getStepStopTime : function () {
                console.log(this.tlStep)
                console.log(this.mediaEls[this.tlStep]);
                return this._getTlElapsed() + this.mediaEls[this.tlStep];
            },
            
            // return number of timeline steps
            getTotalSteps : function () {
                return this.mediaEls.length;
            },
            
            // get total time of past timeline elements
            _getTlElapsed : function () {
                var tlElapsed = 0,
                    that = this;
                    
                for (i = 0; i < that.tlStep; i++) {
                    function func (i) {
                        tlElapsed += that.mediaEls[i].playheadStop - that.mediaEls[i].playheadStart;
                    }
                    
                    func(i);
                }
                return tlElapsed;
            },
            
            getCurrentMedia : function () {
                return this.mediaEls[this.tlStep];
            },
            
            getMediaEls : function () {
                return this.mediaEls;
            },
            
            getTlIndex : function () {
                return this.tlIndex;
            },
            
            // convert timeline time to mediaElement and time
            getElTime : function (tlMs) {
                var that = this,
                    elapsed = 0,
                    el = {};
                    console.log(that.tlIndex);
                function func (i) {
                    if (tlMs >= that.tlIndex[i].start && tlMs < that.tlIndex[i].stop) {
                        el['step'] = i;
                        el['time'] =  tlMs - elapsed;
                        return;
                    }
                    elapsed += that.tlIndex[i].stop - that.tlIndex[i].start;
                }
            
                for (var i = 0; i < that.tlIndex.length; i++) {
                    func(i);
                }
                return el;
            },
            
            getMediaElFromTlTIme : function (tlMs) {
                var el = this.getElTime(tlMs).step;
                console.log(el);
                return this.mediaEls[el];
            },
            
            // index timeline elements for seek events
            _initTlIndex : function () {
                var mediaEls = this.mediaEls,
                    tlSteps = mediaEls.length,
                    index = [],
                    that = this;
                
                for (var i = 0; i < tlSteps; i++) {
                    function func (i) {
                        index[i] = {};
                        index[i].mediaElId = mediaEls[i].id;
                        index[i].start = (i === 0) ? 0 : index[i-1]['stop'];
                        index[i].stop = index[i]['start'] + mediaEls[i]['elLength'];
                    }
                    
                    func(i);
                }
                this.tlIndex = index;
            },
            
            // @@ prob don't use playhead here
            // return tl length in ms
            getTlLength : function () {
                var t = 0;
                _.each(this.mediaEls, function (el) {
                    t +=  parseInt(el.elLength, 10);
                });
                return t;
            },
            
            // get tlMs from DOM event
            getTlMs : function(e) {
                clickX = e.clientX - $('.jp-progress').offset().left;
                seekPerc = clickX/($(e.currentTarget).width());
                tlMs = seekPerc*this.getTlLength();
                return tlMs;
            },
        };

    return Manager;

});