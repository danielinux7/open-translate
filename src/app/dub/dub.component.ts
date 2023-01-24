import { Injectable, Component } from '@angular/core';
declare var $: any;
import { DomSanitizer } from '@angular/platform-browser';
import { Subtitle, Item } from './subtitle';
import { interval, firstValueFrom } from 'rxjs';
import { saveAs } from "file-saver-es";
import JSZip from "jszip";
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '../translate.service';
import { openDB, deleteDB, wrap, unwrap } from 'idb';

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
  playingOriginal;
  isPlayingOriginal = false;
  urlorginal = "/assets/home/1";
  curItem: Item;
  curParItem: Item;
  currentSub =  <Subtitle>{"source":""};
  subtitles = <Subtitle[]>[];
  items = <Item[]>[];
  initSub: Subtitle[];
  subtitlesFilter: Subtitle[];
  subindex;
  subindexList = {};
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
  isSaved: boolean;
  isFont: boolean;
  error;
  dbService;

  constructor(private domSanitizer: DomSanitizer,
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
    this.record.ondataavailable = (e) => {
      this.processRecording(e.data)
    }
    this.playingOriginal.muted = true;
    this.playingOriginal.load();
    this.playingOriginal.play();
    this.progressBarColor = "blue";
    this.progressbarValue = 0.0;
    this.errorBar = "";
    this.startTimer("record");
  }

  startTimer(type) {
    let seconds = this.currentSub.duration;
    const timer$ = interval(100);
    const sub = timer$.subscribe((milisec) => {
      this.cursec = milisec / 10.0;
      this.progressbarValue = (100.0 / seconds) * this.cursec;
      if (parseFloat((this.cursec / seconds).toFixed(1)) >= 0.6) {
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
    this.recording = false;
    if (!this.record) {
      this.errorBar = "Амикрофон ԥшаам";
    }
    else {
      this.record.stop();
      this.playingOriginal.pause();
    }
  }

  deleteClip() {
    let store = this.dbService.transaction(this.curItem.path, 'readwrite').objectStore(this.curItem.path);
    store.delete(this.currentSub["clip"]);
    if (!this.url)
      URL.revokeObjectURL(this.url);
    this.url = "";
    if (this.currentSub["gender"] === "f")
      this.subindex[1]["female"][1] = this.subindex[1]["female"][1] - 1;
    else if (this.currentSub["gender"] === "m")
      this.subindex[1]["male"][1] = this.subindex[1]["male"][1] - 1;
    this.subindex[1]["all"][1] = this.subindex[1]["all"][1] - 1;
    this.dubCount = this.subindex[1][this.subindex[0]][1];
    this.dubCountFilter--;
    if (this.subindex[1]["all"][1] == 0)
      this.dubEmpty = true;
    localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
    localStorage.setItem("items", JSON.stringify(this.items));
    this.progressbarValue = 0.0;
    this.cursec = 0.0;
  }

  processRecording(blob) {
    let duration = blob.size*8/this.record.audioBitsPerSecond;
    let store = this.dbService.transaction(this.curItem.path, 'readwrite').objectStore(this.curItem.path);
    store.put({ audio: blob, clip: this.currentSub["clip"], duration: duration });
    if (!this.url){
      if (this.currentSub["gender"] === "f")
        this.subindex[1]["female"][1] = this.subindex[1]["female"][1] + 1;
      else if (this.currentSub["gender"] === "m")
        this.subindex[1]["male"][1] = this.subindex[1]["male"][1] + 1;
      this.subindex[1]["all"][1] = this.subindex[1]["all"][1] + 1;
      this.dubCount = this.subindex[1][this.subindex[0]][1]
      this.dubCountFilter++;
      localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
    }
    URL.revokeObjectURL(this.url);
    this.url = URL.createObjectURL(blob);
    this.dubEmpty = false;
    this.stream.getAudioTracks()[0].stop();
  }
  /**
  * Process Error.
  */
  errorCallback(error) {
    this.error = 'Can not play audio in your browser';
  }
  async ngOnInit() {
    window.onload = () => {this.isFont = true;}
    this.errorBar = "";
    this.isTranslate = false;
    this.isSource = false;
    this.isReadOnlysen = true;
    this.isSubtitlesSaved = true;
    this.subtitlesFilter = [];
    if (localStorage.getItem("items"))
      this.items = JSON.parse(localStorage.getItem("items"));
    else {
      this.items = await this.getAsset("/assets/items.json");
      localStorage.setItem("items", JSON.stringify(this.items));
    }
    let item = this.items.filter(item => item["active"] === true)[0];
    if (item.collection) {
      this.curParItem = item;
      this.curItem = item.collection.filter(item => item["active"] === true)[0];
    }
    else {
      this.curParItem = null;
      this.curItem = item;
    }
    if (localStorage.getItem("subindexlist")) {
      this.subindexList = JSON.parse(localStorage.getItem("subindexlist"));
      if (!this.subindexList[this.curItem.path])
        this.subindexList[this.curItem.path] = ["all", { "all": [0, 0], "male": [0, 0], "female": [0, 0] }];
    }
    else {
      this.subindexList[this.curItem.path] = ["all", { "all": [0, 0], "male": [0, 0], "female": [0, 0] }];
    }
    localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
    this.subindex = this.subindexList[this.curItem.path];
    this.isFilter = false;
    this.isSubFilter = false;
    this.dubCount = this.subindex[1][this.subindex[0]][1];
    if (this.dubCount > 0)
      this.dubEmpty = false;
    this.initSub = await this.getAsset("/assets/"+this.curItem.path+"/caption.json");
    this.subtitles = this.getSubtitles()
    this.subCount = this.subtitles.filter(sub => sub.target && sub.edit != true).length;
    this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]];
    $("#sentence").text(this.currentSub.target);
    this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
    this.playingOriginal = document.getElementById('video') as HTMLMediaElement;
    this.playingOriginal.onplay = () => { 
      if (this.recording)
        this.record.start();
      if (this.isPlaying) 
        this.playing.play();
    };
    this.playingOriginal.onended = (function () {
      this.isPlayingOriginal = false;
      this.allowRecording = true;
      if (this.recording && this.curItem.path != "noise") {
        this.record.stop();
        this.recording = false;
      }
      if (this.isPlaying && this.curItem.path != "noise") {
        this.playing.pause(); 
        this.isPlaying = false;
      }
    }).bind(this);
    this.playing.onended = (function () {
      this.isPlaying = false;
    }).bind(this);
    this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
    this.playingOriginal.load();
    this.dbService?.close();
    let db = await openDB('dubDB');
    if (!db.objectStoreNames.contains(this.curItem.path)) {
      let ver = db.version+1;
      db.close();
      indexedDB.open('dubDB',ver).onupgradeneeded = (event) => {
        let db = event.target["result"];
        let store = db.createObjectStore(this.curItem.path, { keyPath: 'clip' });
        store.createIndex("audio", "audio", { unique: false });
        store.createIndex("duration", "duration", { unique: false });
        db.close();
      };
    }
    db = await openDB('dubDB');
    this.dbService = db;
    let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
    let dub = await store.get(this.currentSub["clip"]);
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
  }

  async onNext() {
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
      localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
      localStorage.setItem("items", JSON.stringify(this.items));
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get(this.currentSub["clip"]);
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
    }
  }

  async onNextFilter() {
    if (this.indexFilter < this.subtitlesFilter.length-1) {
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
      this.indexFilter++;
      this.currentSub = this.subtitlesFilter[this.indexFilter];
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get(this.currentSub["clip"]);
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
    }
  }

  async onPrevious() {
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
      localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
      localStorage.setItem("items", JSON.stringify(this.items));
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get(this.currentSub["clip"]);
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
    }
  }

  async onPreviousFilter() {
    if (this.indexFilter > 0) {
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
      this.indexFilter--;
      this.currentSub = this.subtitlesFilter[this.indexFilter]
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get(this.currentSub["clip"]);
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
    }
  }

  async onChangeSub() {
    this.isSubFilter = false;
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
      localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
      localStorage.setItem("items", JSON.stringify(this.items));
      this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]]
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get(this.currentSub["clip"]);
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
    }
  }

  getSubtitles(): Subtitle[] {
    let sub;
    if (!localStorage.getItem(this.curItem.path))
      localStorage.setItem(this.curItem.path, JSON.stringify(this.initSub,null,2));
    sub = JSON.parse(localStorage.getItem(this.curItem.path));
    if (this.subindex[0] === "male")
      sub = sub.filter(sub => sub["gender"] === "m")
    else if (this.subindex[0] === "female")
      sub = sub.filter(sub => sub["gender"] === "f")
    return sub;
  }

  async onDownload() {
    let count;
    this.saveSubtitle();
    let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
    count = 0;
    this.progressdownloadValue = 1;
    let zip = new JSZip();
    zip.file(this.curItem.path + ".json", localStorage.getItem(this.curItem.path));
    let cursor = await store.openCursor();
    let singleFile = false;
    let blobs = [];
    while (cursor) {
      if (singleFile) {
        blobs.push(cursor.value.audio);
      }
      else
        zip.file(cursor.key, cursor.value.audio);
      count++;
      this.progressdownloadValue = Math.round((count * 100) / this.dubCount);
      cursor = await cursor.continue();
    }
    if (singleFile)
      zip.file(this.curItem.path,blobs.reduce((a, b)=> new Blob([a, b], {type: a.type})));
    zip.generateAsync({ type: "blob" })
      .then(function (content) {
        setTimeout((() => {
          saveAs(content, this.curItem.path + ".zip");
          this.progressdownloadValue = 0;
        }).bind(this), 500);
      }.bind(this));
  }

  async onDelete() {
    let store = this.dbService.transaction(this.curItem.path,'readwrite').objectStore(this.curItem.path);
    await store.clear();
    localStorage.removeItem(this.curItem.path);
    this.subindexList[this.curItem.path] = ["all", { "all": [0, 0], "male": [0, 0], "female": [0, 0] }];
    this.subindex = this.subindexList[this.curItem.path];
    localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
    this.items = await this.getAsset("/assets/items.json");
    localStorage.setItem("items", JSON.stringify(this.items));
    this.ngOnInit();
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
      this.startTimer("play");
    }
    else {
      this.isPlaying = false;
      this.playing.pause();
      this.playingOriginal.pause();
    }
  }

  onTogglePlayOriginal() {
    this.errorBar = "";
    if (!this.isReadOnlysen) {
      const selection = window.getSelection();
      const range = document.createRange();
      selection.removeAllRanges();
      range.selectNodeContents($("#sentence")[0]);
      range.collapse(false);
      selection.addRange(range);
      $("#sentence")[0].focus();
    }
    if (!this.isPlayingOriginal) {
      this.isPlayingOriginal = true;
      this.playingOriginal.muted = false;
      this.playingOriginal.load();
      this.playingOriginal.play();
      this.startTimer("playOriginal");
    }
    else {
      this.isPlayingOriginal = false;
      this.playingOriginal.pause();
    }
  }

  async onChangeGender(gender) {
    this.errorBar = "";
    this.saveSubtitle();
    let sub = JSON.parse(localStorage.getItem(this.curItem.path));
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
      localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
      localStorage.setItem("items", JSON.stringify(this.items));
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get(this.currentSub["clip"]);
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
    }
  }

  editGender(gender) {
    this.isSubtitlesSaved = false;
    if (gender == "male") 
      this.currentSub.gender = "m";
    else if (gender == "female") 
      this.currentSub.gender = "f";
    const selection = window.getSelection();
    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents($("#sentence")[0]);
    range.collapse(false);
    selection.addRange(range);
    $("#sentence")[0].focus();
  }

  async onUpload() {
    let file = document.getElementById("file") as HTMLInputElement;
    this.error = "";
      JSZip.loadAsync(file.files[0])
         .then(async function(zip: JSZip) {
           if (zip.files[this.curItem.path + ".json"]) {
             let files = [];
             let keys = [];
             let numbers = /^[0-9]+$/;
             zip.forEach(function (relativePath, entry) {
               if (entry.name === this.curItem.path + ".json") {
                 entry.async('string').then(json => {
                   localStorage.setItem(this.curItem.path, json);
                   this.subtitles = this.getSubtitles()
                   this.currentSub = this.subtitles[this.subindex[1][this.subindex[0]][0]];
                   this.inputSub = this.subtitles.indexOf(this.currentSub) + 1;
                   this.subCount = this.subtitles.filter(sub => sub.target && sub.edit != true).length;
                   $("#sentence").text(this.currentSub.target);
                 });
               }
               else if (entry.name.match(numbers)) {
                 keys.push(entry.name);
                 entry.async('blob').then(blob => {
                   blob = new Blob([blob], { type: blob.type });
                   files.push({ "clip": entry.name, "audio": blob, "duration": 0 })
                 });
               }
             }.bind(this));
             // ToDo I need to wait untill the files object is ready
             setTimeout((async () => {
               let store = this.dbService.transaction(this.curItem.path, 'readwrite').objectStore(this.curItem.path);
               files.forEach(async (file) => {
                 await store.put(file)
               });
               keys = await store.getAllKeys();
               let countm = 0;
               let countf = 0;
               let subs = JSON.parse(localStorage.getItem(this.curItem.path));
               subs.forEach(function (sub) {
                 if (keys.includes(sub["clip"])) {
                   if (sub["gender"] === "f") { countf++ }
                   else if (sub["gender"] === "m") { countm++ }
                 }
               });
               this.subindex[1]["male"][1] = countm;
               this.subindex[1]["female"][1] = countf;
               this.subindex[1]["all"][1] = countm + countf;
               localStorage.setItem("subindexlist", JSON.stringify(this.subindexList));
               localStorage.setItem("items", JSON.stringify(this.items));
               this.dubCount = this.subindex[1][this.subindex[0]][1];
               file.value = ""
               $("#uploadModel").modal('hide');
               let dub = await store.get(this.currentSub["clip"]);
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
             }), 500);
           }
           else {
            this.error = "Иашам ZIP афаил";
           }
         }.bind(this), function () { this.error = "Иашам ZIP афаил" }.bind(this)); 
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
    this.currentSub.edit?this.currentSub.edit=false:this.currentSub.edit=true;
    this.isSubtitlesSaved = false;
    const selection = window.getSelection();
    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents($("#sentence")[0]);
    range.collapse(false);
    selection.addRange(range);
    $("#sentence")[0].focus();
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
      this.subtitles = JSON.parse(localStorage.getItem(this.curItem.path));
      let i = this.subtitles.findIndex((sub => sub["clip"] == this.currentSub["clip"]));
      this.subtitles[i]["target"] = $("#sentence").text();
      this.subtitles[i]["gender"] = this.currentSub.gender;
      this.subtitles[i]["edit"] = this.currentSub.edit;
      localStorage.setItem(this.curItem.path, JSON.stringify(this.subtitles,null,2));
      this.subCount = this.subtitles.filter(sub => sub.target && sub.edit != true).length;
      this.dubCountFilter++;
      this.isSubtitlesSaved = true;
      this.isSaved = false;
    }
  }

  async onToggleFilter() {
    this.isSubFilter = false;
    if (this.isFilter === true){
      this.isFilter = false;
      this.onChangeGender({"value":this.subindex[0]});
    }
    else {
      this.isFilter = true;
      this.dubCountFilter = 0;
      this.indexFilter = 0;
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let keys = await store.getAllKeys();
      let subs = JSON.parse(localStorage.getItem(this.curItem.path));
      subs = subs.filter(sub => !keys.includes(sub["clip"]));
      if (subs) {
        if (this.subindex[0] === "female")
          subs = subs.filter(sub => sub["gender"] === "f");
        else if (this.subindex[0] === "male")
          subs = subs.filter(sub => sub["gender"] === "m");
        this.subtitlesFilter = subs;
        this.currentSub = this.subtitlesFilter[0];
        $("#sentence").text(this.currentSub.target);
        this.urlorginal = "/assets/" + this.curItem.path + "/" + this.currentSub["clip"];
        this.playingOriginal.load();
        this.url = "";
        this.progressbarValue = 0.0;
        this.cursec = 0.0;
        this.allowRecording = false;
      }
    }
  }

  async onToggleSubFilter() {
    this.isTranslate = false;
    this.isFilter = false;
    let divTextarea = document.getElementById("sentence");
    const selection = window.getSelection();
    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents(divTextarea);
    range.collapse(false);
    selection.addRange(range);
    divTextarea.focus();
    if (this.isSubFilter === true){
      this.isSubFilter = false;
      this.onChangeGender({"value":this.subindex[0]});
    }
    else {
      this.isSubFilter = true;
      this.dubCountFilter = 0;
      this.indexFilter = 0;
      let subs = this.subtitles.filter(sub => !sub.target || sub.edit == true);
      this.subtitlesFilter = subs;
      this.currentSub = this.subtitlesFilter[0];
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/" + this.curItem.path + "/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get(this.curItem.path, this.currentSub["clip"]);
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
    }
  }

  async setCurItem(item) {
    let itemIndex
    if (this.curParItem) {
      itemIndex = this.items.findIndex(item => item.path == this.curParItem.path);
    }
    else {
      itemIndex = this.items.findIndex(item => item.path == this.curItem.path)
    }
    this.items[itemIndex].active = false;
    if (item.collection) {
      this.curParItem = item;
      this.curParItem.active = true;
      this.curItem = item.collection.filter(item => item["active"] === true)[0]; 
    }
    else {
      this.curParItem = null;
      this.curItem = item;
      this.curItem.active = true;
    }
    localStorage.setItem("items", JSON.stringify(this.items));
    this.ngOnInit();
  }

  async setCurItemCol(item) {
    this.curItem.active = false;
    this.curItem = item;
    this.curItem.active = true;
    localStorage.setItem("items", JSON.stringify(this.items));
    this.ngOnInit();
  }

  onNoise() {
    let item =  this.items.filter(item => item["path"] === "noise")[0]; 
    this.setCurItem(item);
  }
}