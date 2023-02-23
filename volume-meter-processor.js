const FRAME_PER_SECOND = 60;
const FRAME_INTERVAL = 1 / FRAME_PER_SECOND;

const CLIP_LEVEL = 0.98;
const CLIPLAG = 750;
const AVERAGING = 0.95;
class MyWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.leftVolume = 0;
        this.rightVolume = 0;
        this.clipping = false;
        this.t = 0;
        this.lastClip = currentTime;
    }
    volumeAudioProcess( event, track ) {
        var buf = event;
        var bufLength = buf.length;
        var sum = 0;
        var x;
        // Do a root-mean-square on the samples: sum up the squares...
        for (var i=0; i<bufLength; i++) {
            x = buf[i];
            // if (i == 2) {
            // 	console.log(bufLength, buf[i])
            // }
            // if (Math.abs(x)>=CLIP_LEVEL) {
            //     this.clipping = 'danger';
            // } else if (Math.abs(x) > 0.7 && Math.abs(x) < CLIP_LEVEL) {
            //     this.clipping = 'warning';
            // }
            // sum += x * x;
            sum += Math.abs(x);
        }
    
        // ... then take the square root of the sum.
        var rms =  Math.sqrt(sum / bufLength);
        // Now smooth this out with the averaging factor applied
        // to the previous sample - take the max here because we
        // want "fast attack, slow release."
        if (track == 0) {
            this.leftVolume = Math.max(rms, this.leftVolume * AVERAGING);
        } else {
            this.rightVolume = Math.max(rms, this.rightVolume * AVERAGING);
        }
    }
    process(inputs, outputs) {
        const leftinput = inputs[0][0];
        // const rightinput = inputs[0][1];
        // this.port.postMessage(this.checkClipping(), this.volume);
        if (this.t == 0) {
            console.log(inputs, outputs)
            this.t++;
        }
        // this.port.postMessage([this.volume || 2, this.clipping, this.lastClip]);
        if (currentTime - this.lastClip > FRAME_INTERVAL) {
            this.volumeAudioProcess(leftinput, 0);
            // this.volumeAudioProcess(rightinput, 1);
            // console.log(this.leftVolume, this.rightVolume)
            this.port.postMessage([this.leftVolume, inputs]);
            this.lastClip = currentTime;
        }
        // audio processing code here.
        // const output = outputs[0];
        // output.forEach((channel) => {
        //     for (let i = 0; i < channel.length; i++) {
        //         channel[i] =
        //             (Math.random() * 2 - 1) *
        //             (parameters["clipping"].length > 1
        //                 ? parameters["clipping"][i]
        //                 : parameters["clipping"][0]);
        //         // note: a parameter contains an array of 128 values (one value for each of 128 samples),
        //         // however it may contain a single value which is to be used for all 128 samples
        //         // if no automation is scheduled for the moment.
        //     }
        // });
        return true
    }
}

registerProcessor('volume-meter', MyWorkletProcessor);