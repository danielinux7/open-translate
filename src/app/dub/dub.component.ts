import { Injectable, Component } from '@angular/core';
declare var $: any;
import { DomSanitizer } from '@angular/platform-browser';
import SUBTITLES from '../../assets/yargi/1/caption.json';
import { Subtitle } from './subtitle';
import { interval } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { saveAs } from "file-saver-es";
import JSZip from "jszip";
import { HttpClient } from '@angular/common/http';

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
  progressdownloadValue = 0;
  cursec = 0.0;
  errorBar: string;
  progressBarColor = "blue";
  recording = false;
  dubEmpty = true;
  dubCount;
  inputSub: number;
  playing = new Audio();
  isPlaying = false;
  timeout;
  playingOriginal;
  isPlayingOriginal = false;
  urlorginal = "";
  currentSub: Subtitle;
  subtitles: Subtitle[];
  subindex;
  gender: string;
  url;
  allowRecording: Boolean;
  isVoiceover: Boolean;
  isReadOnlysen: Boolean;
  isSubtitlesSaved: Boolean;
  error;

  constructor(private domSanitizer: DomSanitizer,
    private dbService: NgxIndexedDBService,
    private http: HttpClient) { }
  sanitize(url: string) {
    return this.domSanitizer.bypassSecurityTrustUrl(url)["changingThisBreaksApplicationSecurity"];
  }
  /**
  * Start recording.
  */
  initiateRecording() {
    this.recording = true;
    if (!this.url)
      URL.revokeObjectURL(this.url);
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
      mimeType: "audio/webm",
      audioBitsPerSecond : 128000
    };
    //Start Actual Recording
    this.record = new MediaRecorder(stream,options);
    this.playingOriginal.muted = true;
    this.playingOriginal.load();
    this.playingOriginal.play();
    this.record.start();
    this.progressBarColor = "blue";
    this.progressbarValue = 0.0;
    this.errorBar = "";
    this.startTimer("record");
    this.timeout = setTimeout(this.stopRecording.bind(this), this.currentSub.duration * 1000)
  }

  startTimer(type) {
    let seconds = this.currentSub.duration;
    const timer$ = interval(100);
    const sub = timer$.subscribe((milisec) => {
      this.cursec = milisec / 10.0;
      this.progressbarValue = (100.0 / seconds) * this.cursec;
      if (parseFloat((this.cursec / seconds).toFixed(1)) >= 0.7) {
        this.progressBarColor = "green";
      }
      if (type === "record" && !this.recording) {
        sub.unsubscribe();
      }
      else if (type === "play" && !this.isPlaying) {
        sub.unsubscribe();
      }
      else if (type === "playOriginal" && !this.isPlayingOriginal) {
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
      this.playingOriginal.pause();
      this.record.stop();
      this.record.stream.getAudioTracks()[0].stop();
      this.record.addEventListener('dataavailable', event => {
          this.processRecording(event.data)
        });
    }
  }
  /**
  * processRecording Do what ever you want with blob
  * @param  {any} blob Blog
  */
  processRecording(blob) {
    this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
      if (dub) {
        this.dbService.deleteByKey('dub', this.currentSub["clip"]).subscribe((deleted) => {
          if (deleted) {
            if (parseFloat((this.cursec / this.currentSub.duration).toFixed(1)) < 0.7) {
              this.errorBar = "Анҵамҭа аура кьаҿцәоуп!";
              if (this.currentSub["gender"] === "f")
                this.subindex[1]["female"][1] = this.subindex[1]["female"][1] - 1;
              else if (this.currentSub["gender"] === "m")
                this.subindex[1]["male"][1] = this.subindex[1]["male"][1] - 1;
              this.subindex[1]["all"][1] = this.subindex[1]["all"][1] - 1;
              this.dubCount = this.subindex[1][this.subindex[0]][1];
              if (this.subindex[1]["all"][1] == 0)
                this.dubEmpty = true;
              localStorage.setItem("subindex", JSON.stringify(this.subindex));
              this.progressbarValue = 0.0;
              this.cursec = 0.0;
            }
            else {
              if (!this.url)
                 URL.revokeObjectURL(this.url);
              this.url = URL.createObjectURL(blob);
              this.dbService.add('dub', { audio: blob, clip: this.currentSub["clip"], duration: this.cursec })
                .subscribe(() => { });
            }
          }
        });
      }
      else {
        if (parseFloat((this.cursec / this.currentSub.duration).toFixed(1)) < 0.7)
          this.errorBar = "Анҵамҭа аура кьаҿцәоуп!";
        else {
          if (!this.url)
            URL.revokeObjectURL(this.url);
          this.url = URL.createObjectURL(blob);
          this.dbService.add('dub', { audio: blob, clip: this.currentSub["clip"], duration: this.cursec })
            .subscribe((dub) => {
              this.dubEmpty = false;
              if (this.currentSub["gender"] === "f")
                this.subindex[1]["female"][1] = this.subindex[1]["female"][1] + 1;
              else if (this.currentSub["gender"] === "m")
                this.subindex[1]["male"][1] = this.subindex[1]["male"][1] + 1;
              this.subindex[1]["all"][1] = this.subindex[1]["all"][1] + 1;
              this.dubCount = this.subindex[1][this.subindex[0]][1]
              localStorage.setItem("subindex", JSON.stringify(this.subindex));
            });
        }
      }
    });
  }
  /**
  * Process Error.
  */
  errorCallback(error) {
    this.error = 'Can not play audio in your browser';
  }
  ngOnInit() {
    this.errorBar = "";
    this.isReadOnlysen = true;
    this.isSubtitlesSaved = true;
    this.subindex = ["all", { "all": [0, 0], "male": [0, 0], "female": [0, 0] }];
    if (localStorage.getItem("subindex"))
      this.subindex = JSON.parse(localStorage.getItem("subindex"));
    else
      localStorage.setItem("subindex", JSON.stringify(this.subindex));
    let voiceover = JSON.parse(localStorage.getItem("voiceover"));
    if (voiceover === "audio")
      this.isVoiceover = true;
    else if (voiceover === "video")
      this.isVoiceover = false;
    else {
      localStorage.setItem("voiceover", JSON.stringify("audio"));
      this.isVoiceover = true;
    }
    this.dubCount = this.subindex[1][this.subindex[0]][1];
    if (this.dubCount > 0)
      this.dubEmpty = false;
    this.subtitles = this.getSubtitles()
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]];
    this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
    this.playingOriginal = document.getElementById('video') as HTMLMediaElement;
    this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".webm";
    this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
      if (!this.url)
        URL.revokeObjectURL(this.url);
      if (!dub) {
        this.url = "";
        this.allowRecording = false;
      }
      else {
        this.url = URL.createObjectURL(dub["audio"]);
        this.progressBarColor = "green";
        this.cursec = dub["duration"];
        this.allowRecording = true;
        this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
      }
    });
  }

  onNext() {
    if (this.subindex[1][this.subindex[0]][0] < this.subtitles.length - 1) {
      this.errorBar = "";
      this.saveSubtitle();
      if (this.isPlayingOriginal) {
        this.playingOriginal.pause();
        this.isPlayingOriginal = false;
      }
      if (this.isPlaying) {
        this.playing.pause();
        this.isPlaying = false;
      }
      this.subindex[1][this.subindex[0]][0] = this.subindex[1][this.subindex[0]][0] + 1;
      localStorage.setItem("subindex", JSON.stringify(this.subindex));
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".webm";
      this.playingOriginal.load();
      this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
        if (!this.url)
          URL.revokeObjectURL(this.url);
        if (!dub) {
          this.url = "";
          this.progressbarValue = 0.0;
          this.cursec = 0.0;
          this.allowRecording = false;
        }
        else {
          this.url = URL.createObjectURL(dub["audio"]);
          this.progressBarColor = "green";
          this.cursec = dub["duration"];
          this.allowRecording = true;
          this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
        }
      });
    }
  }

  onPrevious() {
    if (this.subindex[1][this.subindex[0]][0] > 0) {
      this.errorBar = "";
      this.saveSubtitle();
      if (this.isPlayingOriginal) {
        this.playingOriginal.pause();
        this.isPlayingOriginal = false;
      }
      if (this.isPlaying) {
        this.playing.pause();
        this.isPlaying = false;
      }
      this.subindex[1][this.subindex[0]][0] = this.subindex[1][this.subindex[0]][0] - 1;
      localStorage.setItem("subindex", JSON.stringify(this.subindex));
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".webm";
      this.playingOriginal.load();
      this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
        if (!this.url)
          URL.revokeObjectURL(this.url);
        if (!dub) {
          this.url = "";
          this.progressbarValue = 0.0;
          this.cursec = 0.0;
          this.allowRecording = false;
        }
        else {
          this.url = URL.createObjectURL(dub["audio"]);
          this.progressBarColor = "green";
          this.cursec = dub["duration"];
          this.allowRecording = true;
          this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
        }
      });
    }
  }

  onChangeSub() {
    let tempNum = this.inputSub - 1;
    if (tempNum <= this.subtitles.length - 1 && tempNum >= 0) {
      this.errorBar = "";
      this.saveSubtitle();
      if (this.isPlayingOriginal) {
        this.playingOriginal.pause();
        this.isPlayingOriginal = false;
      }
      if (this.isPlaying) {
        this.playing.pause();
        this.isPlaying = false;
      }
      this.subindex[1][this.subindex[0]][0] = tempNum;
      localStorage.setItem("subindex", JSON.stringify(this.subindex));
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".webm";
      this.playingOriginal.load();
      this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
        if (!this.url)
          URL.revokeObjectURL(this.url);
        if (!dub) {
          this.url = "";
          this.progressbarValue = 0.0;
          this.cursec = 0.0;
          this.allowRecording = false;
        }
        else {
          this.url = URL.createObjectURL(dub["audio"]);
          this.progressBarColor = "green";
          this.cursec = dub["duration"];
          this.allowRecording = true;
          this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
        }
      });
    }
  }

  getSubtitles(): Subtitle[] {
    let sub;
    if (!localStorage.getItem("subtitle"))
      localStorage.setItem("subtitle", JSON.stringify(SUBTITLES,null,2));
    sub = JSON.parse(localStorage.getItem("subtitle"));
    if (this.subindex[0] === "male")
      sub = sub.filter(sub => sub["gender"] === "m")
    else if (this.subindex[0] === "female")
      sub = sub.filter(sub => sub["gender"] === "f")
    return sub;
  }

  onDownload() {
    let db;
    let count;
    this.saveSubtitle();
    indexedDB.open('dubDB').onsuccess = (event) => {
      db = event.target["result"];
      count = 0;
      this.progressdownloadValue = 0;
      const zip = new JSZip();
      zip.file("subtitle.json",localStorage.getItem("subtitle"));
      const transaction = db.transaction("dub", "readonly");
      const objectStore = transaction.objectStore("dub");
      objectStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          zip.file(cursor.value["clip"] + ".webm", cursor.value["audio"])
          count++;
          this.progressdownloadValue = Math.round((count*100)/this.dubCount);
          cursor.continue();
        }
        else {
          zip.generateAsync({ type: "blob" })
            .then(function (content) {
              setTimeout((() => {
                saveAs(content, "audio.zip");
                this.progressdownloadValue = 0;
              }).bind(this),500);
            }.bind(this));
        }
      };
    };
  }

  onDelete() {
    this.dbService.clear('dub').subscribe((successDeleted) => {
      this.subindex = ["all", { "all": [0, 0], "male": [0, 0], "female": [0, 0] }];
      this.dubEmpty = true;
      this.dubCount = 0;
      if (!this.url)
        URL.revokeObjectURL(this.url);
      this.url = "";
      this.errorBar = "";
      this.cursec = 0.0;
      this.allowRecording = false;
      this.progressbarValue = 0.0;
      this.isVoiceover = true;
      localStorage.clear();
      localStorage.setItem("subindex", JSON.stringify(this.subindex));
      localStorage.setItem("voiceover", JSON.stringify("audio"));
      this.subtitles = this.getSubtitles()
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]];
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      this.playingOriginal = document.getElementById('video') as HTMLMediaElement;
      this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".webm";
      this.playingOriginal.load();
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
      this.playingOriginal.muted = true;
      this.playingOriginal.load();
      this.playingOriginal.play();
      this.playing.play();
      this.startTimer("play");
      this.playing.onended = function () { 
        this.playingOriginal.pause(); 
        this.isPlaying = false;
      }.bind(this);
    }
    else {
      this.isPlaying = false;
      this.playing.pause();
      this.playingOriginal.pause();
    }
  }

  onTogglePlayOriginal() {
    this.errorBar = "";
    if (!this.isPlayingOriginal) {
      this.isPlayingOriginal = true;
      this.playingOriginal.muted = false;
      this.playingOriginal.load();
      this.playingOriginal.play();
      this.startTimer("playOriginal");
      this.playingOriginal.onended = (function () {
        this.isPlayingOriginal = false;
        this.allowRecording = true;
      }).bind(this);
    }
    else {
      this.isPlayingOriginal = false;
      this.playingOriginal.pause();
    }
  }

  onChangeGender(gender) {
    this.errorBar = "";
    this.saveSubtitle();
    let sub = JSON.parse(localStorage.getItem("subtitle"));
    if (this.isPlayingOriginal) {
      this.playingOriginal.pause();
      this.isPlayingOriginal = false;
    }
    if (this.isPlaying) {
      this.playing.pause();
      this.isPlaying = false;
    }
    if (gender.value === "male") {
      this.subindex[0] = "male";
      this.subtitles = sub.filter(sub => sub["gender"] === "m");
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
    }
    else if (gender.value === "female") {
      this.subindex[0] = "female";
      this.subtitles = sub.filter(sub => sub["gender"] === "f");
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
    }
    else {
      this.subindex[0] = "all";
      this.subtitles = sub;
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
    }
    this.dubCount = this.subindex[1][this.subindex[0]][1]
    localStorage.setItem("subindex", JSON.stringify(this.subindex));
    this.urlorginal = "/assets/yargi/1/" + this.currentSub["clip"] + ".webm";
    this.playingOriginal.load();
    this.dbService.getByKey('dub', this.currentSub["clip"]).subscribe((dub) => {
      if (!this.url)
        URL.revokeObjectURL(this.url);
      if (!dub) {
        this.url = "";
        this.progressbarValue = 0.0;
        this.cursec = 0.0;
        this.allowRecording = false;
      }
      else {
        this.url = URL.createObjectURL(dub["audio"]);
        this.progressBarColor = "green";
        this.cursec = dub["duration"];
        this.allowRecording = true;
        this.progressbarValue = (this.cursec / this.currentSub["duration"]) * 100;
      }
    });
  }

  onToggleVoiceover(voiceover) {
    if (voiceover.value === "audio") {
      this.isVoiceover = false;
      localStorage.setItem("voiceover", JSON.stringify("video"));
    }
    else if (voiceover.value === "video") {
      this.isVoiceover = true;
      localStorage.setItem("voiceover", JSON.stringify("audio"));
    }

  }

  onUpload() {
    let file = document.getElementById("file") as HTMLInputElement;
      JSZip.loadAsync(file.files[0])
         .then(function(zip: JSZip) {
          let files= [];
          let keys = [];
          zip.forEach(function (relativePath,entry) {
            if (entry.name === "subtitle.json"){
              entry.async('string').then(json => {
                localStorage.setItem("subtitle", json);
                this.subtitles = this.getSubtitles()
                this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
                this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
              });
            }
            else {
              keys.push(entry.name.slice(0,-5));
              entry.async('blob').then(blob => {
                blob = new Blob([blob], { type: "audio/webm;codecs=opus" });
                files.push({"clip":entry.name.slice(0,-5), "audio":blob, "duration":0})
              });
            }
          }.bind(this));
          this.dbService.bulkDelete('dub', keys).subscribe(() => {
            this.dbService.bulkAdd('dub', files).subscribe(() => { });
          });
         }.bind(this), function() {this.error = "Иашам ZIP афаил"}.bind(this)); 
    }

  onEdit() {
    let divTextarea = document.getElementById("sentence");
    if (this.isReadOnlysen === true) {
      this.isReadOnlysen = false;
      divTextarea.contentEditable = 'true';
      // const selection = window.getSelection();
      // const range = document.createRange();
      // selection.removeAllRanges();
      // range.selectNodeContents(divTextarea);
      // range.collapse(false);
      // selection.addRange(range);
      divTextarea.focus();
    }
    else {
      this.isReadOnlysen = true
      divTextarea.contentEditable = 'false';
      this.saveSubtitle();
    }
  }

  onChangeText() {
        this.isSubtitlesSaved = false;
  }
  
  saveSubtitle() {
    if (this.isSubtitlesSaved === false) {
      let divTextarea = document.getElementById("sentence");
      let sub = JSON.parse(localStorage.getItem("subtitle"));
      this.currentSub.sentence = divTextarea.textContent;
      let i = parseInt(this.currentSub["clip"])-1;
      sub[i]["sentence"] = this.currentSub.sentence;
      localStorage.setItem("subtitle", JSON.stringify(sub,null,2));
      this.isSubtitlesSaved = true;
    }
  }
}
