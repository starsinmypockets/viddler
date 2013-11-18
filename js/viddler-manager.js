define([], function() {
   
   // manage global timeline events
    var Manager = {
            tlStep : 0,
            tlSteps :0,
            tlLength : 0,
            tlElapsed : 0,
            tlNow : 0,
            timeline : {},
            mediaEls : {},
            stepMedia : {},
            stepMediaId: '',
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
                this.stepMedia = {};
                this.stepMediaId = '';
                this.tlComments = {};
                this.tlIndex = {};
            },
            
            // reinitialize timeline
            tlReset : function () {
                this.tlStep = 0;
                this.tlElapsed = 0;
                this.tlNow = 0;
            },
            
            getCurrentMedia : function () {
                return this.mediaEls[this.tlStep];
            },
            
            // convert timeline time to mediaElement and time
            getElTime : function (tlMs) {
                var that = this,
                    elapsed = 0,
                    el = {};
                function func (i) {
                    if (tlMs >= that.tlIndex[i].start && tlMs < that.tlIndex[i].stop) {
                        el['step'] = i;
                        el['time'] =  tlMs - elapsed + mediaEls[i].playheadStart;
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
                return this.mediaEls[el];
            },
            
            // get total time of past timeline elements
            getElapsedElTime : function () {
                var tlElapsed = 0,
                    that = this;
                    
                for (i = 0; i < that.tlStep; i++) {
                    function func (i) {
                        that.tlElapsed += that.mediaEls[i].playheadStop - that.mediaEls[i].playheadStart;
                    }
                    
                    func(i);
                }
            },
            
            // index timeline elements for seek events
            initTlIndex : function () {
                var mediaEls = this.mediaEls,
                    tlSteps = mediaEls.length,
                    index = [],
                    that = this;
                
                for (var i = 0; i < tlSteps; i++) {
                    function func (i) {
                        index[i] = {};
                        index[i].mediaElId = mediaEls[i].id;
                        index[i].start = (i === 0) ? 0 : index[i-1]['stop'];
                        index[i].stop = index[i]['start'] + mediaEls[i]['playheadStop'] - mediaEls[i]['playheadStart'];
                    }
                    
                    func(i);
                }
                this.tlIndex = index;
            },
            
            // get tlMs from DOM event
            getTlMs : function(e) {
                clickX = e.clientX - $('.jp-progress').offset().left;
                seekPerc = clickX/($(e.currentTarget).width());
                tlMs = seekPerc*this.tlLength;
                return tlMs;
            }
        };

    return Manager;

});