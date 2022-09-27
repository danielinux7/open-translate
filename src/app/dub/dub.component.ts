import {  Injectable, Component } from '@angular/core';
declare var $: any;
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import SUBTITLES from '../../assets/yargi/1/caption.json';
import { Subtitle } from './subtitle';
import { Observable,interval } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { saveAs } from "file-saver-es";
import JSZip from "jszip";
import { HttpClient } from '@angular/common/http';
import { CookieService} from 'ngx-cookie-service';

@Component({
  selector: 'app-dub',
  templateUrl: './dub.component.html',
  styleUrls: ['./dub.component.css']
})
@Injectable()
export class DubComponent {
  title = 'micRecorder';
  record;
  progressbarValue = 0.0;
  cursec = 0.0;
  errorBar = "";
  progressBarColor = "blue";
  recording = false;
  dubEmpty = true;
  dubCount: number;
  inputSub: number;
  playing = new Audio();
  isPlaying = false;
  playingOriginal = new Audio();
  isPlayingOriginal = false;

  urlorginal = "";
  currentSub: Subtitle;
  subtitles: Subtitle[];
  subindex: number;
  url;
  error;

  constructor(private domSanitizer: DomSanitizer, 
              private dbService: NgxIndexedDBService, 
              private http: HttpClient, 
              private cookie: CookieService) { }
  sanitize(url: string) {
    return this.domSanitizer.bypassSecurityTrustUrl(url)["changingThisBreaksApplicationSecurity"];
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
      numberOfAudioChannels: 1
    };
    //Start Actuall Recording
    var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
    this.record = new StereoAudioRecorder(stream, options);
    this.record.record();
    this.progressBarColor = "blue";
    this.progressbarValue = 0.0;
    this.errorBar = "";
  //   this.record.setRecordingDuration(this.currentSub.duration*1000, function() {
  //     this.processRecording(this.getBlob());
  //  });
    this.startTimer();
  }

  startTimer() {
    let seconds = this.currentSub.duration;
    const timer$ = interval(100);
    const sub = timer$.subscribe((milisec) => {
      this.cursec = milisec / 10.0;
      this.progressbarValue = (100.0 / seconds) * this.cursec;
      if (this.cursec / seconds >= 0.7) {
        this.progressBarColor = "green";
      }
      if (Math.floor(this.cursec / seconds) == 1.0) {
        this.progressBarColor = "green";
        this.stopRecording();
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
    if (!this.record) {
      this.errorBar = "Амикрофон ԥшаам";
    }
    else {
      this.record.stop(this.processRecording.bind(this));
    }
  }
  /**
  * processRecording Do what ever you want with blob
  * @param  {any} blob Blog
  */
  processRecording(blob) {
    if (this.cursec / this.currentSub.duration < 0.7) {
      this.errorBar = "Анҵамҭа аура кьаҿцәоуп!";
    }
    else {
      this.url = URL.createObjectURL(blob);
      this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
        if (!dub) {
          this.dbService.add('dub', { audio: blob, clip: this.currentSub["clip"], duration: this.cursec })
            .subscribe((dub) => { this.dubEmpty = false; this.dubCount++;});
        }
        else {
          this.dbService.update('dub', { audio: blob, clip: this.currentSub["clip"], duration: this.cursec })
            .subscribe((dub) => { this.dubEmpty = false; });
        }
      });

    }
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
    if (this.cookie.check('subindex'))
      this.subindex = parseInt(this.cookie.get("subindex"));
    this.currentSub = this.subtitles[this.subindex]
    this.inputSub = this.subtitles.indexOf(this.currentSub)+1;
    this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".mp3";
    this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
      if (!dub) {
        this.url = "";
      }
      else {
        this.url = URL.createObjectURL(dub["audio"]);
        this.progressBarColor = "green";
        this.cursec = dub["duration"];
        this.progressbarValue = (this.cursec/this.currentSub["duration"])*100;
      }
    });
    this.dbService.count('dub').subscribe((count) => {
      this.dubCount = count;
      if (count > 0) {
        this.dubEmpty = false;
      }
    });
  }

  onNext() {
    if (this.subindex < this.subtitles.length - 1) {
      this.subindex = this.subindex + 1;
      this.cookie.set("subindex", this.subindex.toString())
      this.currentSub = this.subtitles[this.subindex]
      this.inputSub = this.subtitles.indexOf(this.currentSub)+1;
      this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".mp3";
      this.getAsset(this.urlorginal);
      this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
        if (!dub) {
          this.url = "";
          this.progressbarValue = 0.0;
          this.cursec = 0.0;
        }
        else {
          this.url = URL.createObjectURL(dub["audio"]);
          this.progressBarColor = "green";
          this.cursec = dub["duration"];
          this.progressbarValue = (this.cursec/this.currentSub["duration"])*100;
        }
      });
    }
  }

  onPrevious() {
    if (this.subindex > 0) {
      this.subindex = this.subindex - 1;
      this.cookie.set("subindex", this.subindex.toString())
      this.currentSub = this.subtitles[this.subindex]
      this.inputSub = this.subtitles.indexOf(this.currentSub)+1;
      this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".mp3";
      this.getAsset(this.urlorginal);
      this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
        if (!dub) {
          this.url = "";
          this.progressbarValue = 0.0;
          this.cursec = 0.0;
        }
        else {
          this.url = URL.createObjectURL(dub["audio"]);
          this.progressBarColor = "green";
          this.cursec = dub["duration"];
          this.progressbarValue = (this.cursec/this.currentSub["duration"])*100;
        }
      });
    }
  }

  getSubtitles(): Subtitle[] {
    return SUBTITLES;
  }

  onDownload() {
    this.dbService.getAll('dub').subscribe((dub) => {
      console.log(dub);
      const zip = new JSZip();
      for (let i in dub) {
        zip.file(dub[i]["clip"] + ".wav", dub[i]["audio"])
      }
      zip.generateAsync({ type: "blob" })
        .then(function (content) {
          saveAs(content, "audio.zip");
        });
    });
  }

  onDelete() {
    this.dbService.clear('dub').subscribe((successDeleted) => {
      this.dubEmpty = true;
      this.dubCount = 0;
      this.url = "";
      this.cursec = 0.0;
      this.progressbarValue = 0.0;
    });
  }

  onToggleRecording() {
    if (!this.recording) {
      this.initiateRecording();
    }
    else {
      this.stopRecording();
    }
  }

  onTogglePlay() {
    this.playing.src = this.sanitize(this.url);
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.playing.load();
      this.playing.play();
      this.playing.onended = function() { }
    }
    else {
      this.isPlaying = false;
      this.playing.pause();
    }
  }

  onTogglePlayOriginal() {
    this.playingOriginal.src = this.urlorginal;
    if (!this.isPlayingOriginal) {
      this.isPlayingOriginal = true;
      this.playingOriginal.load();
      this.playingOriginal.play();
      this.playingOriginal.onended = function() { }
    }
    else {
      this.isPlayingOriginal = false;
      this.playingOriginal.pause();
    }
  }

  getAsset(url:any) {
    this.http.get<any>(url);
  }

  onChangeSub() {
    let tempNum = this.inputSub - 1;
    if (tempNum <= this.subtitles.length - 1 && tempNum >= 0) {
      this.subindex = tempNum;
      this.cookie.set("subindex", this.subindex.toString())
      this.currentSub = this.subtitles[this.subindex]
      this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".mp3";
      this.getAsset(this.urlorginal);
      this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
        if (!dub) {
          this.url = "";
          this.progressbarValue = 0.0;
          this.cursec = 0.0;
        }
        else {
          this.url = URL.createObjectURL(dub["audio"]);
          this.progressBarColor = "green";
          this.cursec = dub["duration"];
          this.progressbarValue = (this.cursec/this.currentSub["duration"])*100;
        }
      });
    }
  }
}
