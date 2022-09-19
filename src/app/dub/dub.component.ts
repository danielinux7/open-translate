import { Component } from '@angular/core';
declare var $: any;
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import { SUBTITLES } from './subtitles';
import { Subtitle } from './subtitle';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dub',
  templateUrl: './dub.component.html',
  styleUrls: ['./dub.component.css']
})
export class DubComponent {
  title = 'micRecorder';
  record;
  progressbarValue = 0.0;
  cursec = 0.0;
  errorBar = "";
  progressBarColor = "blue";
  recording = false;
  currentSub: Subtitle;
  subtitles: Subtitle[];
  subindex: number;
  url;
  error;
  constructor(private domSanitizer: DomSanitizer) { }
  sanitize(url: string) {
    return this.domSanitizer.bypassSecurityTrustUrl(url);
  }
  /**
  * Start recording.
  */
  initiateRecording() {
    this.recording = true;
    this.url = null;
    let mediaConstraints = {
      video: false,
      audio: true
    };
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(this.successCallback.bind(this), this.errorCallback.bind(this));
  }
  /**
  * Will be called automatically.
  */
  successCallback(stream) {
    var options = {
      mimeType: "audio/wav",
      numberOfAudioChannels: 1,
      sampleRate: 44000,
    };
    //Start Actuall Recording
    var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
    this.record = new StereoAudioRecorder(stream, options);
    this.record.record();
    this.progressBarColor = "blue";
    this.progressbarValue = 0.0;
    this.errorBar = "";
    this.startTimer(this.currentSub.duration)
  }

  startTimer(seconds: number) {
    const time = seconds;
    const timer$ = interval(100);
    const sub = timer$.subscribe((milisec) => {
      this.progressbarValue = (100.0/seconds)*(milisec/10.0);
      this.cursec = milisec/10.0;
      if ((milisec/10.0)/(seconds) >= 0.7) {
        this.progressBarColor = "green";
      }
      if ((milisec/10.0)/(seconds) > 1.0) {
        this.progressBarColor = "red";
      }
      if (!this.recording) {
        sub.unsubscribe();
      }
    });
  }

  /**
  * Stop recording.
  */
  stopRecording() {
    this.recording = false;
    this.record.stop(this.processRecording.bind(this));
  }
  /**
  * processRecording Do what ever you want with blob
  * @param  {any} blob Blog
  */
  processRecording(blob) {
    if (this.cursec/this.currentSub.duration < 0.7) {
      this.errorBar = "Анҵамҭа аура кьаҿцәоуп!";
    }
    else if (this.cursec/this.currentSub.duration > 1) {
      this.errorBar = "Анҵамҭа аура дуцәоуп!";
    }
    else {
      this.url = URL.createObjectURL(blob);
    }
    // console.log("blob", blob);
    // console.log("url", this.url);
  }
  /**
  * Process Error.
  */
  errorCallback(error) {
    this.error = 'Can not play audio in your browser';
  }
  ngOnInit() {
    this.subtitles = this.getSubtitles()
    this.subindex = 0;
    this.currentSub = this.subtitles[this.subindex]
  }

  onNext() {
    if (this.subindex < this.subtitles.length - 1){
      this.subindex = this.subindex + 1;
      this.currentSub = this.subtitles[this.subindex]
    }
  }

  onPrevious() {
    if (this.subindex > 0){
      this.subindex = this.subindex - 1;
      this.currentSub = this.subtitles[this.subindex]
    }
  }

  getSubtitles(): Subtitle[] {
    return SUBTITLES;
  }
}
