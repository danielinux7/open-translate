import { Injectable, Component } from '@angular/core';
declare var $: any;
import { DomSanitizer } from '@angular/platform-browser';
import { Subtitle } from './subtitle';
import { interval, firstValueFrom } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { saveAs } from "file-saver-es";
import JSZip from "jszip";
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '../translate.service';

@Component({
  selector: 'app-dub',
  templateUrl: './dub.component.html',
  styleUrls: ['./dub.component.css']
})
@Injectable()
export class DubComponent {
  title = 'micRecorder';
  record: MediaRecorder;
  stream;
  progressbarValue = 0.0;
  progressdownloadValue = 0;
  cursec = 0.0;
  errorBar: string;
  translation: string;
  progressBarColor = "blue";
  recording = false;
  dubEmpty = true;
  dubCount: number;
  subCount: number;
  dubCountFilter: number;
  indexFilter: number;
  inputSub: number;
  playing = new Audio();
  isPlaying = false;
  timeout;
  playingOriginal;
  isPlayingOriginal = false;
  urlorginal = "/assets/home/1";
  currentSub =  <Subtitle>{"source":""};
  subtitles = <Subtitle[]>[];
  initSub: Subtitle[];
  subtitlesFilter: Subtitle[];
  subindex;
  gender: string;
  url;
  allowRecording: Boolean;
  isReadOnlysen: Boolean;
  isWarning: Boolean;
  isSubtitlesSaved: Boolean;
  isFilter: boolean;
  isSubFilter: boolean;
  isSource: boolean;
  isTranslate: boolean;
  isCopy: boolean;
  isNote: boolean;
  isSaved: boolean;
  error;

  constructor(private domSanitizer: DomSanitizer,
    private dbService: NgxIndexedDBService,
    private http: HttpClient,
    private translateService: TranslateService) {}

  sanitize(url: string) {
    return this.domSanitizer.bypassSecurityTrustUrl(url)["changingThisBreaksApplicationSecurity"];
  }

  getAsset(url){
    return firstValueFrom(this.http.get<any>(url));
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
      audio: {
        echoCancellation: false,
        autoGainControl: true,
        noiseSuppression: false,
      }     };
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(this.successCallback.bind(this), this.errorCallback.bind(this));
  }
  /**
  * Will be called automatically.
  */
  successCallback(stream) {
    this.stream = stream;
    var options = {
      audioBitsPerSecond: 128000
    };
    this.record = new MediaRecorder(stream, options);
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
      this.record.ondataavailable = (e) => {
        this.processRecording(e.data)
      }
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
              this.dubCountFilter--;
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
                .subscribe(() => { 
                  this.dubEmpty = false;
                  this.stream.getAudioTracks()[0].stop();
                   });
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
              this.dubCountFilter++;
              localStorage.setItem("subindex", JSON.stringify(this.subindex));
              this.stream.getAudioTracks()[0].stop();
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
  async ngOnInit() {
    this.errorBar = "";
    this.isReadOnlysen = true;
    this.isSubtitlesSaved = true;
    this.subtitlesFilter = [];
    this.subindex = ["all", { "all": [0, 0], "male": [0, 0], "female": [0, 0] }];
    if (localStorage.getItem("subindex"))
      this.subindex = JSON.parse(localStorage.getItem("subindex"));
    else
      localStorage.setItem("subindex", JSON.stringify(this.subindex));
    this.isFilter = false;
    this.isSubFilter = false;
    this.dubCount = this.subindex[1][this.subindex[0]][1];
    if (this.dubCount > 0)
      this.dubEmpty = false;
    this.initSub = await this.getAsset("/assets/home/caption.json");
    this.subtitles = this.getSubtitles()
    this.subCount = this.subtitles.filter(sub => sub.target).length;
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]];
    this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
    this.playingOriginal = document.getElementById('video') as HTMLMediaElement;
    this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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
      if (this.isReadOnlysen === false) {
        let divTextarea = document.getElementById("sentence");
        const selection = window.getSelection();
        const range = document.createRange();
        selection.removeAllRanges();
        range.selectNodeContents(divTextarea);
        range.collapse(false);
        selection.addRange(range);
        divTextarea.focus();
      }
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
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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

  onNextFilter() {
    if (this.indexFilter < this.subtitlesFilter.length-1) {
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
      this.indexFilter++;
      this.currentSub = this.subtitlesFilter[this.indexFilter];
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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
      if (this.isReadOnlysen === false) {
        let divTextarea = document.getElementById("sentence");
        const selection = window.getSelection();
        const range = document.createRange();
        selection.removeAllRanges();
        range.selectNodeContents(divTextarea);
        range.collapse(false);
        selection.addRange(range);
        divTextarea.focus();
      } 
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
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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

  onPreviousFilter() {
    if (this.indexFilter > 0) {
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
      this.indexFilter--;
      this.currentSub = this.subtitlesFilter[this.indexFilter]
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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
      localStorage.setItem("subtitle", JSON.stringify(this.initSub,null,2));
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
      let transaction = db.transaction("dub", "readonly");
      let dub = transaction.objectStore("dub");
      count = 0;
      this.progressdownloadValue = 0;
      let zip = new JSZip();
      zip.file("subtitle.json",localStorage.getItem("subtitle"));
      let subs = JSON.parse(localStorage.getItem("subtitle"));
      let keysRequest = dub.getAllKeys();
      dub.getAllKeys().onsuccess = () => {
        let keys = keysRequest.result;
        subs = subs.filter(sub => !keys.includes(sub["clip"]));
        zip.file("subtitle-no-record.json",JSON.stringify(subs,null,2));
      }
      dub.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          zip.file(cursor.value["clip"], cursor.value["audio"])
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
      localStorage.clear();
      localStorage.setItem("subindex", JSON.stringify(this.subindex));
      this.subtitles = this.getSubtitles()
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]];
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      this.playingOriginal = document.getElementById('video') as HTMLMediaElement;
      this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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
    if (sub.filter(sub => sub["gender"] === gender.value).length > 0 || gender.value == "all") {
      if (this.isPlayingOriginal) {
        this.playingOriginal.pause();
        this.isPlayingOriginal = false;
      }
      if (this.isPlaying) {
        this.playing.pause();
        this.isPlaying = false;
      }
      if (gender.value === "m") {
        this.subindex[0] = "male";
        this.subtitles = sub.filter(sub => sub["gender"] === "m");
        this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
        this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      }
      else if (gender.value === "f") {
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
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.dubCount = this.subindex[1][this.subindex[0]][1]
      localStorage.setItem("subindex", JSON.stringify(this.subindex));
      this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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

  editGender(gender) {
    this.isSubtitlesSaved = false;
    if (gender == "male") 
      this.currentSub.gender = "m";
    else if (gender == "female") 
      this.currentSub.gender = "f";
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
            else if (entry.name.split(".")[1] !== "json") {
              keys.push(entry.name);
              entry.async('blob').then(blob => {
                blob = new Blob([blob], { type: blob.type });
                files.push({"clip":entry.name, "audio":blob, "duration":0})
              });
            }
          }.bind(this));
          this.dbService.bulkDelete('dub', keys).subscribe(() => {
            this.dbService.bulkAdd('dub', files).subscribe(() => { 
              indexedDB.open('dubDB').onsuccess = (event) => {
                let db = event.target["result"];
                let transaction = db.transaction("dub", "readonly");
                let dub = transaction.objectStore("dub");
                let keysRequest = dub.getAllKeys();
                dub.getAllKeys().onsuccess = () => {
                  let subs = JSON.parse(localStorage.getItem("subtitle"));
                  let keys = keysRequest.result;
                  let countm = 0;
                  let countf = 0;
                  subs.forEach(function(sub){
                    if (keys.includes(sub["clip"])) {
                      if (sub["gender"] ==="f") { countf++ }
                      else if (sub["gender"] ==="m") { countm++ }
                    }
                  });
                  this.subindex[1]["male"][1] = countm;
                  this.subindex[1]["female"][1] = countf;
                  this.subindex[1]["all"][1] = countm+countf;
                  localStorage.setItem("subindex", JSON.stringify(this.subindex));
                  this.dubCount = this.subindex[1][this.subindex[0]][1];
                  file.value = ""
                  $("#uploadModel").modal('hide');
                }
              };
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
            });
          });
         }.bind(this), function() {this.error = "Иашам ZIP афаил"}.bind(this)); 
    }

  onEdit() {
    if (this.isReadOnlysen === true) {
      this.isReadOnlysen = false;
      $("#sentence")[0].contentEditable = 'true';
      const selection = window.getSelection();
      const range = document.createRange();
      selection.removeAllRanges();
      range.selectNodeContents($("#sentence")[0]);
      range.collapse(false);
      selection.addRange(range);
      $("#sentence")[0].focus();
    }
    else {
      this.isReadOnlysen = true
      this.isSource = false;
      this.isTranslate = false;
      $("#sentence")[0].contentEditable = 'false';
      this.saveSubtitle();
      this.currentSub.target = $("#sentence").text();
    }
  }

  showSource() {
    this.isSource?this.isSource=false:this.isSource=true;
    if (this.isSource == true)
      this.isTranslate = false;
    const selection = window.getSelection();
    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents($("#sentence")[0]);
    range.collapse(false);
    selection.addRange(range);
    $("#sentence")[0].focus();
  }

  showTranslate() {
    this.isTranslate?this.isTranslate=false:this.isTranslate=true;
    if (this.isTranslate == true) {
      this.isSource = false;
      this.getTranslate();
    }
    else {
      this.translation = "";
    }
    const selection = window.getSelection();
    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents($("#sentence")[0]);
    range.collapse(false);
    selection.addRange(range);
    $("#sentence")[0].focus();
  }

  saveCurrent() {
    this.isSaved?this.isSaved=false:this.isSaved=true;
    if (this.isSaved == false)
      this.saveSubtitle();    
    const selection = window.getSelection();
    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents($("#sentence")[0]);
    range.collapse(false);
    selection.addRange(range);
    $("#sentence")[0].focus();
  }

  async getTranslate() {
    this.isSubtitlesSaved = false;
    const formData = new FormData();
    formData.append('langSrc', "ru");
    formData.append('langTgt', "ab");
    formData.append('source', this.currentSub.source);
    this.translation = "";
    let translate = await this.translateService.getTranslateDub(formData)
    this.translation = translate["target"];
  }

  makeCopy() {
    if (this.isTranslate == true) {
      this.isCopy = true;
      this.isTranslate = false;
      this.isSaved = true;
      setTimeout((() => {
        this.isCopy = false;
      }).bind(this), 500);
      this.currentSub.target = this.translation;
      $("#sentence").text(this.translation);
    }
    const selection = window.getSelection();
    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents($("#sentence")[0]);
    range.collapse(false);
    selection.addRange(range);
    $("#sentence")[0].focus();
  }

  makeNote() {
    this.isNote?this.isNote=false:this.isNote=true;
    if (this.isNote == true) {
      
    }

  }

  onChangeText(e) {
    this.isSubtitlesSaved = false;
    this.isSaved = true;
    let length = $("#sentence").text().length;
    if (e.code == "Enter") {
      e.preventDefault();
    }
    if (length >= this.currentSub.length + 1) {
      this.isWarning = true;
      setTimeout((() => {
        this.isWarning = false
      }).bind(this), 500);
    }
  }
  
  saveSubtitle() {
    if (this.isSubtitlesSaved === false) {
      this.subtitles = JSON.parse(localStorage.getItem("subtitle"));
      let i = parseInt(this.currentSub["clip"])-1;
      this.subtitles[i]["target"] = $("#sentence").text();
      this.subtitles[i]["gender"] = this.currentSub.gender;
      localStorage.setItem("subtitle", JSON.stringify(this.subtitles,null,2));
      this.subCount = this.subtitles.filter(sub => sub.target).length;
      this.dubCountFilter++;
      this.isSubtitlesSaved = true;
      this.isSaved = false;
    }
  }

  onToggleFilter() {
    this.isSubFilter = false;
    if (this.isFilter === true){
      this.isFilter = false;
      this.onChangeGender({"value":this.subindex[0]});
    }
    else {
      this.isFilter = true;
      this.dubCountFilter = 0;
      this.indexFilter = 0;
      indexedDB.open('dubDB').onsuccess = (event) => {
        let db = event.target["result"];
        let transaction = db.transaction("dub", "readonly");
        let dub = transaction.objectStore("dub");
        let keysRequest = dub.getAllKeys();
        dub.getAllKeys().onsuccess = () => {
          let subs = JSON.parse(localStorage.getItem("subtitle"));
          let keys = keysRequest.result;
          subs = subs.filter(sub => !keys.includes(sub["clip"]));
          if (subs) {
            if (this.subindex[0] === "female")
              subs = subs.filter(sub => sub["gender"] === "f");
            else if (this.subindex[0] === "male")
              subs = subs.filter(sub => sub["gender"] === "m");
            this.subtitlesFilter = subs;
            this.currentSub = this.subtitlesFilter[0];
            $("#sentence").text(this.currentSub.target);
            this.urlorginal = "/assets/home/" + this.currentSub["clip"];
            this.playingOriginal.load();
            this.url = "";
            this.progressbarValue = 0.0;
            this.cursec = 0.0;
            this.allowRecording = false;
          }
        }
      };
    }
  }

  onToggleSubFilter() {
    this.isFilter = false;
    if (this.isSubFilter === true){
      this.isSubFilter = false;
      this.onChangeGender({"value":this.subindex[0]});
    }
    else {
      this.isSubFilter = true;
      this.dubCountFilter = 0;
      this.indexFilter = 0;
      let subs = this.subtitles.filter(sub => !sub.target);
      this.subtitlesFilter = subs;
      this.currentSub = this.subtitlesFilter[0];
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/home/" + this.currentSub["clip"];
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
}
