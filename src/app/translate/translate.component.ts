import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Lang, Dlink } from '../language';
import { TranslateService } from '../translate.service';
import { CookieService} from 'ngx-cookie-service';
import * as id from "uuid";

@Component({
  selector: 'translate',
  templateUrl: './translate.component.html',
  styleUrls: ['./translate.component.css']
})
export class TranslateComponent implements OnInit {
  langs: Lang[];
  selectedSrcLang: Lang;
  selectedTgtLang: Lang;
  temp: Lang;
  tempText: string;
  src: string;
  tgt: string;
  data: string;
  placeholderTgt = "Аиҭага"
  isReadOnlyTgt = true
  starred = false
  edit = false
  isNote = [true,true,true,true];
  selectedType: string;
  file: File;
  photo: File;
  downloadLink: Dlink;
  height = "172px"
  // regular expression for lines with only white spaces
  regexp: RegExp = /^[\t\r\n\s]*$/;

  constructor(private translateService: TranslateService, private cookie: CookieService) { }

  ngOnInit(): void {
    this.getLangs();
    this.selectedSrcLang = this.langs[0]
    this.selectedTgtLang = this.langs[1]
    this.selectedType = "text"
    if (localStorage.getItem("isNote"))
      this.isNote = JSON.parse(localStorage.getItem("isNote"))["note"];
    else
      localStorage.setItem("isNote", JSON.stringify({"note":this.isNote}));
  }

  onSelectType(type: string): void {
    this.selectedType = type
  }

  onFileSelect(event) {
    if (event.target.files.length > 0) {
      this.file = event.target.files[0];
    }
  }
  onPhotoSelect(event) {
    if (event.target.files.length > 0) {
      this.photo = event.target.files[0];
    }
  }

  onCancelFile() {
    this.file = null
    this.downloadLink = null
  }

  onCancelPhoto() {
    this.photo = null
  }

  onClear() {
    this.src = null
    this.tgt = null
    this.placeholderTgt = "Аиҭага";
    this.isReadOnlyTgt = true
    this.starred = false
    this.edit = false
    this.height = "172px"
  }

  onChangeText(element) {
    this.starred = false
    this.height = element.scrollHeight + "px"
    if (this.src === "") {
      this.onClear()
    }
  }

  onSelectSrc(lang: Lang): void {
    if (lang === this.selectedTgtLang) {
      this.temp = this.selectedSrcLang
      this.selectedSrcLang = this.selectedTgtLang;
      this.selectedTgtLang = this.temp;
    }
    else
      this.selectedSrcLang = lang;
  }

  onSelectTgt(lang: Lang): void {
    if (lang === this.selectedSrcLang) {
      this.temp = this.selectedSrcLang
      this.selectedSrcLang = this.selectedTgtLang;
      this.selectedTgtLang = this.temp;
    }
    else
      this.selectedTgtLang = lang;
  }

  onSwap() {
    this.temp = this.selectedSrcLang
    this.tempText = this.src
    this.selectedSrcLang = this.selectedTgtLang;
    this.selectedTgtLang = this.temp;
    this.src = this.tgt
    this.tgt = this.tempText
  }

  onTranslate() {
    if (this.selectedType === "text") {
      if (!this.src || this.regexp.test(this.src)) {
        this.placeholderTgt = "Аиҭага";
        this.isReadOnlyTgt = true;
        return;
      }
      if (!this.tgt)
        this.placeholderTgt = "Аиҭагара иаҿуп";
      else
        this.tgt = this.tgt + "..."
      // Here we add HTTP implementation
      this.getTranslate()
    }
    else if (this.selectedType === "doc") {
      if (this.file) {
        this.getTranslate()
      }
    }
  }
   
  @ViewChild('mytgt') mytgt: ElementRef;
  onEdit() {
    if (this.edit === false){
      this.starred = false
      this.edit = true;
      this.isReadOnlyTgt = false;
      this.mytgt.nativeElement.focus();
    }
    else {
      this.isReadOnlyTgt = true
      this.edit = false
    }
  }
  
  onConv() {
    if (this.file) {
      this.getConv()
    }
  }

  onRead() {
    if (this.photo) {
      this.getRead()
      this.selectedType = "text"
    }
  }

  // fucntions to call the translate services
  getLangs(): void {
    this.langs = this.translateService.getLangs();
  }

  getTranslate(): void {
    const formData = new FormData();
    formData.append('langSrc', this.selectedSrcLang.id);
    formData.append('langTgt', this.selectedTgtLang.id);
    if (this.selectedType === "text") {
      formData.append('source', this.src);
      this.translateService.getTranslate(formData)
        .subscribe(data => this.tgt = data["target"]);
    }
    else if (this.selectedType === "doc") {
      formData.append('file', this.file);
      this.translateService.getTranslate(formData)
        .subscribe(data => this.downloadLink = data);
    }
  }

  getConv() {
    const formData = new FormData();
    formData.append('file', this.file);
    this.translateService.getConv(formData)
      .subscribe(data => this.downloadLink = data);
  }

  getRead() {
    const formData = new FormData();
    formData.append('langSrc', this.selectedSrcLang.id);
    formData.append('langTgt', this.selectedTgtLang.id);
    formData.append('photo', this.photo);
    this.translateService.getRead(formData)
      .subscribe(data => this.src = data["source"]);
  }

  onStarred() {
    if (this.starred === false) {
      this.edit = false;
      if (this.cookie.get("UUID") === '')
        this.cookie.set("UUID",id.v4(),5000)
      const formData = new FormData();
      formData.append('langSrc', this.selectedSrcLang.id);
      formData.append('langTgt', this.selectedTgtLang.id);
      formData.append('source', this.src);
      formData.append('target', this.tgt);
      formData.append('UUID', this.cookie.get("UUID"));
      this.translateService.setStar(formData)
        .subscribe(data => this.starred = data["star"]);
    }
  }

  closeNote(loc: number) {
    this.isNote[loc] = false;
    localStorage.setItem("isNote", JSON.stringify({"note":this.isNote}));
  }
}
