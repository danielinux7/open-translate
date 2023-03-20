import { Injectable, Component } from '@angular/core';
declare var $: any;
import { DomSanitizer } from '@angular/platform-browser';
import { Subtitle, Metadata, Item } from './subtitle';
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
  indexFilter: number;
  inputSub: number;
  extra: number;
  playing = new Audio();
  isPlaying = false;
  playingOriginal;
  isPlayingOriginal = false;
  urlorginal = "/assets/home/1";
  curItem: Item;
  curParItem: Item;
  currentSub =  <Subtitle>{"source":""};
  subtitles = <Subtitle[]>[];
  metadata: Metadata[];
  initMetadata: Metadata[];
  curChar: Metadata;
  newChar: Metadata;
  items = <Item[]>[];
  initSub: Subtitle[];
  subtitlesFilter: Subtitle[];
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
  isHide: boolean;
  isAddChar: boolean;
  isCopyChar: boolean;
  isEditChar: boolean;
  canPlay: boolean;
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
        autoGainControl: false,
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
      if (this.recording) {
        this.processRecording(e.data);
        this.recording = false;
      }
    }
    this.playingOriginal.muted = true;
    this.playingOriginal.load();
    this.playingOriginal.play();
    this.record.start((this.currentSub.duration+this.extra)*1000+50);
    this.progressBarColor = "blue";
    this.progressbarValue = 0.0;
    this.errorBar = "";
    this.startTimer("record");
  }

  startTimer(type) {
    let seconds = this.currentSub.duration+this.extra;
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
        this.cursec = this.playing.duration;
        sub.unsubscribe();
      }
      else if (type === "playOriginal" && !this.isPlayingOriginal) {
        this.cursec = this.currentSub.duration;
        sub.unsubscribe();
      }
    });
  }

  /**
  * Stop recording.
  */
  stopRecording() {
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
    store.delete([this.currentSub.clip,this.curChar.charType]);
    if (!this.url)
      URL.revokeObjectURL(this.url);
    this.url = "";
    // this.dubEmpty = true;
    localStorage.setItem("items", JSON.stringify(this.items));
    this.progressbarValue = 0.0;
    this.cursec = 0.0;
  }

  processRecording(blob) {
    // let duration = blob.size*8/this.record.audioBitsPerSecond;
    let store = this.dbService.transaction(this.curItem.path, 'readwrite').objectStore(this.curItem.path);
    store.put({ audio: blob, clip: this.currentSub.clip, character: this.curChar.charType });
    URL.revokeObjectURL(this.url);
    this.url = URL.createObjectURL(blob);
    this.dubEmpty = false;
    this.stream.getAudioTracks()[0].stop();
    if (this.currentSub.extra < this.extra )
      this.currentSub.extended = true;
    else
      this.currentSub.extended = false;
    this.isSubtitlesSaved = false;
    this.saveSubtitle();
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
    this.canPlay = false;
    this.extra = 0;
    this.isTranslate = false;
    this.isSource = false;
    this.isAddChar = false;
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
    this.isFilter = false;
    this.isSubFilter = false;
    // this.dubEmpty = false;
    this.initMetadata = await this.getAsset("/assets/"+this.curItem.path+"/metadata.json");
    this.initSub = await this.getAsset("/assets/"+this.curItem.path+"/caption.json");
    this.subtitles = this.getSubtitles()
    this.currentSub = this.subtitles[this.curChar.charIndex];
    $("#sentence").text(this.currentSub.target);
    this.inputSub = this.subtitles.indexOf(this.currentSub);
    window.ononline = (function () {
      $("#offlineModel").modal('hide');
      this.ngOnInit();
    }).bind(this);
    window.onoffline = (function () {
      $("#offlineModel").modal('show');
    }).bind(this);
    this.playingOriginal = document.getElementById('video') as HTMLMediaElement;
    this.playingOriginal.oncanplay = (function () {
      this.canPlay = true;
    }).bind(this);  
    this.playingOriginal.onended = (function () {
      this.isPlayingOriginal = false;
      this.allowRecording = true;
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
        let store = db.createObjectStore(this.curItem.path, { keyPath: ['clip', 'character'] });
        store.createIndex("audio", "audio", { unique: false });
        store.createIndex("character", "character", { unique: false });
        db.close();
      };
    }
    db = await openDB('dubDB');
    this.dbService = db;
    let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
    let dub = await store.get([this.currentSub.clip,this.curChar.charType]);
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
    if (this.curChar.charIndex < this.subtitles.length - 1) {
      this.errorBar = "";
      this.canPlay = false;
      this.extra = 0;
      this.curChar.charIndex = this.curChar.charIndex + 1;
      this.inputSub = this.curChar.charIndex;
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
      localStorage.setItem("items", JSON.stringify(this.items));
      this.currentSub = this.subtitles[this.curChar.charIndex]
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get([this.currentSub.clip,this.curChar.charType]);
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
      this.canPlay = false;
      this.extra = 0;
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
      let dub = await store.get([this.currentSub.clip,this.curChar.charType]);
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
    if (this.curChar.charIndex > 0) {
      this.errorBar = "";
      this.canPlay = false;
      this.extra = 0;
      this.curChar.charIndex = this.curChar.charIndex - 1;
      this.inputSub = this.curChar.charIndex;
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
      localStorage.setItem("items", JSON.stringify(this.items));
      this.currentSub = this.subtitles[this.curChar.charIndex]
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get([this.currentSub.clip,this.curChar.charType]);
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
      this.canPlay = false;
      this.extra = 0;
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
      let dub = await store.get([this.currentSub.clip,this.curChar.charType]);
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
    if (this.inputSub <= this.subtitles.length - 1 && this.inputSub >= 0) {
      this.extra = 0;
      this.canPlay = false;
      this.errorBar = "";
      this.currentSub = this.subtitles[this.inputSub]
      this.curChar.charIndex = this.inputSub;
      this.saveSubtitle();
      if (this.isPlayingOriginal) {
        this.playingOriginal.pause();
        this.isPlayingOriginal = false;
      }
      if (this.isPlaying) {
        this.playing.pause();
        this.isPlaying = false;
      }
      localStorage.setItem("items", JSON.stringify(this.items));
      if (this.isTranslate == true) {
        this.getTranslate();
      }
      $("#sentence").text(this.currentSub.target);
      this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get([this.currentSub.clip,this.curChar.charType]);
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
    if (!localStorage.getItem(this.curItem.path + "/" + "metadata"))
      localStorage.setItem(this.curItem.path + "/" + "metadata", JSON.stringify(this.initMetadata,null,2));
    this.metadata = JSON.parse(localStorage.getItem(this.curItem.path + "/" + "metadata"));
    this.curChar = this.metadata.filter(char => char.active == true)[0];
    sub = JSON.parse(localStorage.getItem(this.curItem.path));
    sub = sub.filter(sub => sub["character"].includes(this.curChar.charType));
    return sub;
  }

  async onDownload() {
    this.saveSubtitle();
    let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
    this.progressdownloadValue = 1;
    let zip = new JSZip();
    zip.file(this.curItem.path + ".json", localStorage.getItem(this.curItem.path));
    zip.file(this.curItem.path + "_metadata.json", localStorage.getItem(this.curItem.path + "/" + "metadata"));
    let cursor = await store.openCursor();
    let singleFile = false;
    let blobs = [];
    while (cursor) {
      if (singleFile) {
        blobs.push(cursor.value.audio);
      }
      else
        zip.file(cursor.key[1]+"/"+cursor.key[0], cursor.value.audio);
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
    let isPurge = true;
    if (isPurge) {
      localStorage.clear();
      let db = await deleteDB('dubDB');
    }
    else {
      let store = this.dbService.transaction(this.curItem.path,'readwrite').objectStore(this.curItem.path);
      await store.clear();
      localStorage.removeItem(this.curItem.path);
      localStorage.removeItem(this.curItem.path + "/" + "metadata");
      localStorage.removeItem("items");
    }
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
      this.playing.play();
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
      if (this.canPlay == true) {
        this.isPlayingOriginal = true;
        this.playingOriginal.muted = false;
        this.playingOriginal.load();
        this.playingOriginal.play();
        this.startTimer("playOriginal");
      }
      else {
        $("#offlineModel").modal('show');
      }
    }
    else {
      this.isPlayingOriginal = false;
      this.playingOriginal.pause();
    }
  }

  async onChangeChar(char) {
    let sub = JSON.parse(localStorage.getItem(this.curItem.path));
    sub = sub.filter(sub => sub["character"].includes(char.charType));
    if (sub.length > 0){
      this.errorBar = "";
      this.canPlay = false;
      this.extra = 0;
      this.isFilter = false;
      this.isSubFilter = false;
      this.isTranslate = false;
      this.isPlaying = false;
      this.isPlayingOriginal = false;
      this.playing.pause();
      this.playingOriginal.pause();
      this.curChar = this.metadata.filter(char2 => char2.active == true)[0];
      this.curChar.active = false;
      char.active = true;
      this.curChar = char;
      this.saveSubtitle();
      this.subtitles = sub
      this.currentSub = this.subtitles[char.charIndex]
      this.inputSub = char.charIndex;
      $("#sentence").text(this.currentSub.target);
      localStorage.setItem("items", JSON.stringify(this.items));
      this.urlorginal = "/assets/" + this.curItem.path + "/" + this.currentSub["clip"];
      this.playingOriginal.load();
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let dub = await store.get([this.currentSub.clip,this.curChar.charType]);
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

  editChar(char) {
    this.isSubtitlesSaved = false;
    this.isSaved = true;
    let index = this.currentSub.character.indexOf(char.charType);
    index==-1?this.currentSub.character.push(char.charType):this.currentSub.character.splice(index,1);
    const selection = window.getSelection();
    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNodeContents($("#sentence")[0]);
    range.collapse(false);
    selection.addRange(range);
    $("#sentence")[0].focus();
  }

  addChar() {
    this.isAddChar?this.isAddChar=false:this.isAddChar=true;
    this.newChar = {charType:"",charIndex: 0, charLabel:"", active: false};
    this.isCopyChar = false;
    this.isEditChar = false;
  }

  saveChar() {
    if (this.isEditChar == true){
      this.curChar.charLabel = this.newChar.charLabel.trim();
      this.isEditChar = false;
      this.isAddChar = false;
      localStorage.setItem(this.curItem.path + "/" + "metadata", JSON.stringify(this.metadata,null,2));
    }
    else {
      let label = this.newChar.charLabel.trim();
      if (label != "" && !this.metadata.find(char => char.charLabel == label)) {
        this.newChar.charType = this.makeCharType();
        this.metadata.push(this.newChar);
        if (this.isCopyChar) {
          let subs = JSON.parse(localStorage.getItem(this.curItem.path));
          subs = subs.map(sub => {
            if (sub.character.includes(this.curChar.charType))
              sub.character.push(this.newChar.charType);
            return sub;
          })
          localStorage.setItem(this.curItem.path, JSON.stringify(subs,null,2));
        }
        this.isCopyChar = false;
        this.isAddChar = false;
        localStorage.setItem(this.curItem.path + "/" + "metadata", JSON.stringify(this.metadata,null,2));
      }
    }
  }

  copyChar() {
    this.isEditChar = false;
    this.isCopyChar?this.isCopyChar=false:this.isCopyChar=true;
  }

  editCharItem() {
    this.isCopyChar = false;
    this.isEditChar?this.isEditChar=false:this.isEditChar=true;
    this.newChar.charLabel = this.curChar.charLabel;
  }

  makeCharType() {
    let result = '';
    let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let char;
    let isUnique = false;
    while (!isUnique) {
      result = alpha.charAt(Math.floor(Math.random() * alpha.length));
      result += alpha.charAt(Math.floor(Math.random() * alpha.length));
      char = this.metadata.find(char => char.charType == result);
      if (char == undefined)
        isUnique = true;
    }
    return result;
  }

  uploadModel() {
    this.progressbarValue = 0;
  }

  async onUpload() {
    let file = document.getElementById("file") as HTMLInputElement;
    this.error = "";
    let total = 0;
    let current = 0;
    let numbers = /^[0-9]+$/;
    this.progressbarValue = 0.0;
    JSZip.loadAsync(file.files[0])
      .then(async function (zip: JSZip) {
        zip.forEach(function (relativePath, entry) {
          let e = entry.name.split('/');
          if (!entry.dir && e[1].match(numbers))
            total++;
        })
        if (zip.files[this.curItem.path + ".json"]) {
          zip.files[this.curItem.path + "_metadata.json"].async('string').then(json => {
            localStorage.setItem(this.curItem.path + "/" + "metadata", json);
            this.metadata = JSON.parse(localStorage.getItem(this.curItem.path + "/" + "metadata"));
            this.curChar = this.metadata.filter(char => char.active == true)[0];
          });
          zip.files[this.curItem.path + ".json"].async('string').then(json => {
            localStorage.setItem(this.curItem.path, json);
            this.subtitles = this.getSubtitles()
            this.currentSub = this.subtitles[this.curChar.charIndex];
            this.inputSub = this.subtitles.indexOf(this.currentSub);
            $("#sentence").text(this.currentSub.target);
            this.urlorginal = "/assets/"+this.curItem.path+"/" + this.currentSub["clip"];
            this.playingOriginal.load();
            if (total == 0) {
              file.value = ""
              $("#uploadModel").modal('hide');
            }
          });
          zip.forEach(function (relativePath, entry) {
            let e = entry.name.split('/');
            if (e[1].match(numbers)) {
              entry.async('blob').then(async blob => {
                blob = new Blob([blob], { type: blob.type });
                let store = this.dbService.transaction(this.curItem.path, 'readwrite').objectStore(this.curItem.path);
                await store.put({ "clip": e[1], "audio": blob, "character": e[0] })
                current++;
                this.progressbarValue = (100.0 / total) * current;
                if (current == total) {
                  $("#uploadModel").modal('hide');
                  file.value = ""
                store = this.dbService.transaction(this.curItem.path, 'readwrite').objectStore(this.curItem.path);
                let dub = await store.get([this.currentSub.clip,this.curChar.charType]);
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
              });
            }
          }.bind(this));
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
    this.isFilter = false;
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
    this.isSaved = true;
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
      let sub = JSON.parse(localStorage.getItem(this.curItem.path));
      let i = sub.findIndex((sub => sub["clip"] == this.currentSub["clip"]));
      sub[i]["target"] = $("#sentence").text();
      sub[i]["character"] = this.currentSub.character;
      sub[i]["edit"] = this.currentSub.edit;
      sub[i]["extended"] = this.currentSub.extended;
      localStorage.setItem(this.curItem.path, JSON.stringify(sub,null,2));
      this.isSubtitlesSaved = true;
      this.isSaved = false;
      this.subtitles = sub.filter(sub => sub["character"].includes(this.curChar.charType));
    }
    localStorage.setItem(this.curItem.path + "/" + "metadata", JSON.stringify(this.metadata,null,2));
  }

  async onToggleFilter() {
    this.isSubFilter = false;
    if (this.isFilter === true){
      this.isFilter = false;
      this.onChangeChar(this.curChar);
    }
    else {
      let store = this.dbService.transaction(this.curItem.path).objectStore(this.curItem.path);
      let keys = await store.getAllKeys();
      keys = keys.filter(key => key[1] == this.curChar.charType);
      keys = keys.map(arr => arr[0]);
      let subs = this.subtitles.filter(sub => !keys.includes(sub["clip"]));
      if (subs.length > 0) {
        this.isFilter = true;
        this.indexFilter = 0;
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
      this.onChangeChar(this.curChar);
    }
    else {
      let subs = this.subtitles.filter(sub => !sub.target || sub.edit == true);
      if (subs.length > 0) {
        this.isSubFilter = true;
        this.indexFilter = 0;
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
  }

  async setCurItem(item) {
    let itemIndex
    if (this.curParItem) {
      itemIndex = this.items.findIndex(item => item.path == this.curParItem.path);
      this.isHide?this.isHide=false:this.isHide=true;
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
    this.curParItem.badge = this.curItem.label;
    localStorage.setItem("items", JSON.stringify(this.items));
    this.ngOnInit();
  }

  onNoise() {
    let item =  this.items.filter(item => item["path"] === "noise")[0]; 
    this.setCurItem(item);
  }

  addTime(){
    if (this.currentSub.extra <= this.extra ) {
      this.extra = this.extra + 0.5;
      return;
    }
    if (this.currentSub.extra > this.extra + 1)
      this.extra = this.extra + 1;
    else
      this.extra = this.currentSub.extra;
  }

  focusOnEdit() {
    if (!this.isReadOnlysen) {
      $("#sentence")[0].focus();
    }
  }
}