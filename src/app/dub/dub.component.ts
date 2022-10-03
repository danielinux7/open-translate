import { Injectable, Component } from '@angular/core';
declare var $: any;
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import SUBTITLES from '../../assets/yargi/1/caption.json';
import { Subtitle } from './subtitle';
import { Observable, interval } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { saveAs } from "file-saver-es";
import JSZip from "jszip";
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

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
  dubCount;
  inputSub: number;
  playing = new Audio();
  isPlaying = false;
  timeout;
  playingOriginal = new Audio();
  isPlayingOriginal = false;
  urlorginal = "";
  currentSub: Subtitle;
  subtitles: Subtitle[];
  subindex;
  gender: string;
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
    //Start Actual Recording
    var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
    this.record = new StereoAudioRecorder(stream, options);
    this.record.record();
    this.progressBarColor = "blue";
    this.progressbarValue = 0.0;
    this.errorBar = "";
    this.startTimer();
    this.timeout = setTimeout(this.stopRecording.bind(this), this.currentSub.duration * 1000)
  }

  startTimer() {
    let seconds = this.currentSub.duration;
    const timer$ = interval(100);
    const sub = timer$.subscribe((milisec) => {
      this.cursec = milisec / 10.0;
      this.progressbarValue = (100.0 / seconds) * this.cursec;
      if (parseFloat((this.cursec / seconds).toFixed(1)) >= 0.7) {
        this.progressBarColor = "green";
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
    clearTimeout(this.timeout);
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
    if (parseFloat((this.cursec / this.currentSub.duration).toFixed(1)) < 0.7) {
      this.errorBar = "Анҵамҭа аура кьаҿцәоуп!";
    }
    else {
      let duration = parseFloat((this.record.length / this.record.sampleRate).toFixed(3));
      this.url = URL.createObjectURL(blob);
      this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
        if (!dub) {
          this.dbService.add('dub', { audio: blob, clip: this.currentSub["clip"], duration: duration })
            .subscribe((dub) => {
              this.dubEmpty = false;
              if (this.currentSub["gender"] === "f")
                this.subindex[1]["female"][1] = this.subindex[1]["female"][1] + 1;
              else if (this.currentSub["gender"] === "m")
                this.subindex[1]["male"][1] = this.subindex[1]["male"][1] + 1;
              this.subindex[1]["all"][1] = this.subindex[1]["all"][1] + 1;
              this.dubCount = this.subindex[1][this.subindex[0]][1]
              this.cookie.set("subindex", JSON.stringify(this.subindex))
            });
    }
        else {
      this.dbService.update('dub', { audio: blob, clip: this.currentSub["clip"], duration: duration })
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
  this.subindex = ["all", { "all": [0,0], "male": [0,0], "female": [0,0] }];
  if (this.cookie.check('subindex'))
    this.subindex = JSON.parse(this.cookie.get("subindex"));
  else 
    this.cookie.set("subindex", JSON.stringify(this.subindex),5000)
  this.subtitles = this.getSubtitles()
  this.dubCount = this.subindex[1][this.subindex[0]][1];
  if (this.dubCount > 0)
    this.dubEmpty = false;
  this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]];
  this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
  this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".mp3";
  this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
    if (!dub) {
      this.url = "";
    }
    else {
      this.url = URL.createObjectURL(dub["audio"]);
      this.progressBarColor = "green";
      this.cursec = dub["duration"];
      this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
    }
  });
}

onNext() {
  if (this.subindex[1][this.subindex[0]][0] < this.subtitles.length - 1) {
    this.subindex[1][this.subindex[0]][0] = this.subindex[1][this.subindex[0]][0] + 1;
    this.cookie.set("subindex", JSON.stringify(this.subindex))
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
    this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
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
        this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
      }
    });
  }
}

onPrevious() {
  if (this.subindex[1][this.subindex[0]][0] > 0) {
    this.subindex[1][this.subindex[0]][0] = this.subindex[1][this.subindex[0]][0] - 1;
    this.cookie.set("subindex", JSON.stringify(this.subindex))
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
    this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
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
        this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
      }
    });
  }
}

onChangeSub() {
  let tempNum = this.inputSub - 1;
  if (tempNum <= this.subtitles.length - 1 && tempNum >= 0) {
    this.subindex[1][this.subindex[0]][0] = tempNum;
    this.cookie.set("subindex", JSON.stringify(this.subindex))
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
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
        this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
      }
    });
  }
}

getSubtitles(): Subtitle[] {
  let sub;
  if (this.subindex[0] === "male")
    sub = SUBTITLES.filter(sub => sub["gender"] === "m")
  else if (this.subindex[0] === "female")
    sub = SUBTITLES.filter(sub => sub["gender"] === "f")
  else 
    sub = SUBTITLES;
  return sub;
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
    this.cookie.delete("subindex");
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
    this.playing.onended = function () { }
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
    this.playingOriginal.onended = function () { }
  }
  else {
    this.isPlayingOriginal = false;
    this.playingOriginal.pause();
  }
}

getAsset(url: any) {
  this.http.get<any>(url);
}

onChangeGender(gender) {
  if (gender.value === "male") {
    this.subindex[0] = "male";
    this.subtitles = SUBTITLES.filter(sub => sub["gender"] === "m");
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
    this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
  }
  else if (gender.value === "female") {
    this.subindex[0] = "female";
    this.subtitles = SUBTITLES.filter(sub => sub["gender"] === "f");
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
    this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
  }
  else {
    this.subindex[0] = "all";
    this.subtitles = SUBTITLES;
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
    this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
  }
  this.dubCount = this.subindex[1][this.subindex[0]][1]
  this.cookie.set("subindex", JSON.stringify(this.subindex))
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
      this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
    }
  });
}
}
