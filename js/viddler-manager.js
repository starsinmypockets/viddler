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
                console.log(that.tlIndex);
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
            
            // really the code should go in here
            setTlIndex : function (index) {
                this.tlIndex = index;
            },
            
            secs2time : function(seconds) {
                var hours   = Math.floor(seconds / 3600);
                var minutes = Math.floor((seconds - (hours * 3600)) / 60);
                var seconds = seconds - (hours * 3600) - (minutes * 60);
                var time = "";
            
                (hours !== 0) ? time = hours+":" : time = hours+":";
                if (minutes != 0 || time !== "") {
                  minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
                } else {
                    minutes = "00:";
                }  
                time += minutes+":";
                if (seconds === 0) { 
                    time+="00";
                } else {
                    time += (seconds < 10) ? "0"+seconds : String(seconds);
                }
                return time;
            }
        };

    return Manager;

});