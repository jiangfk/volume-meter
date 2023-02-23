/*
The MIT License (MIT)

Copyright (c) 2014 Chris Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var audioContext = null;
var meter = null;
var leftCanvasContext = null;
var rightCanvasContext = null;
var WIDTH = 500;
var HEIGHT = 50;
var rafID = null;
var mediaStreamSource = null;
var player = null;
var videoPlayer = null
var firstTime = true;
let leftProcessorNode = null;
let rightProcessorNode = null;
let clipping = false;
let splitNode = null;
let leftVolume = 0;
let rightVolume = 0;
window.onload = function () {
    // grab our canvas
    // 初始化m3u8
    initLive()
    leftCanvasContext = document.getElementById('leftmeter');
    rightCanvasContext = document.getElementById('rightmeter');
    vumeter(leftCanvasContext);
    vumeter(rightCanvasContext);
}

function initLive() {
    player = window.videojs(`play-channel-video`);
    player.src({
        src: 'https://livent.ntjoy.com/nttv1/playlist.m3u8?_upt=8ec048871676635856',
        // src: 'https://live-test.aihoge.com/api/live/push_sd.flv',
        // src: 'https://livent2.ntjoy.com/rd/playlist.m3u8?_upt=87890beb1676368381',
        // src: 'https://livent.ntjoy.com/aac_970/playlist.m3u8?_upt=7b704c3b1676552974',
        // src: 'https://livent.ntjoy.com/nttv1/playlist.m3u8?_upt=8ec048871676635856',
        type: 'application/x-mpegURL',
    });
    videoPlayer = document.getElementById(`play-channel-video`).querySelector('video');
    player.load()
    player.on('play', () => {
        if (firstTime) {
            startMeter();
            firstTime = false;
        }
    });
    player.on("playing", function () {
        console.log("视频播放中", leftProcessorNode)
        audioContext.resume()
    });
}
async function initProcessor() {
    // let processorNode = null;
    try {
        leftProcessorNode = new AudioWorkletNode(audioContext, 'volume-meter');
        rightProcessorNode = new AudioWorkletNode(audioContext, 'volume-meter');
    } catch (e) {
        try {
            console.log("adding...");
            await audioContext.audioWorklet.addModule("volume-meter-processor.js")
            leftProcessorNode = new AudioWorkletNode(audioContext, "volume-meter");
            rightProcessorNode = new AudioWorkletNode(audioContext, "volume-meter");
            leftProcessorNode.port.onmessage = ({ data }) => {
                // console.log('监听的内容1', data)
                leftVolume = data[0]
                leftCanvasContext.setAttribute('data-volume', leftVolume);
            }
            rightProcessorNode.port.onmessage = ({ data }) => {
                // console.log('监听的内容2', data)
                rightVolume = data[0]
                rightCanvasContext.setAttribute('data-volume', rightVolume);
            }
            leftProcessorNode.addEventListener('processorerror', (evn) => {
                console.log(evn)
            })
            rightProcessorNode.addEventListener('processorerror', (evn) => {
                console.log(evn)
            })
        } catch (e) {
            console.log(`** Error: Unable to create worklet node: ${e}`);
            return null;
        }
    }
    console.log(leftProcessorNode, rightProcessorNode)
    await audioContext.resume();
    // return processorNode;
}

async function startMeter() {
    // grab an audio context
    audioContext = new AudioContext();
    mediaStreamSource = audioContext.createMediaElementSource(videoPlayer);
    // split channel track
    splitNode = audioContext.createChannelSplitter(2);
    mediaStreamSource.connect(splitNode);
    // init volumn monitor worklet
    await initProcessor()
    // to deal with chorme siliece problem
    mediaStreamSource.connect(audioContext.destination)
    // splitnode output to processornode fromnode.connect(tonode, fromindexoutput, toindexinput); default zero
    splitNode.connect(leftProcessorNode, 0)
    splitNode.connect(rightProcessorNode, 1)
    // merge channel track
    const mergeNode = audioContext.createChannelMerger(2);
    // node connection
    leftProcessorNode.connect(mergeNode, 0, 0)
    rightProcessorNode.connect(mergeNode, 0, 1)
    // have to connect destination, or the stream cant flow
    mergeNode.connect(audioContext.destination)
}