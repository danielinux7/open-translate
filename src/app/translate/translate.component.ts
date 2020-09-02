import { Component, OnInit } from '@angular/core';
import { Lang } from '../language';
import { TranslateService } from '../translate.service';

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
  placeholderTgt = "Аиҭагара"
  isReadOnlyTgt = true
  selectedType: string;
  file: File;
  photo: File;
  downloadLink: string;
  // regular expression for lines with only white spaces
  regexp: RegExp = /^[\t\r\n\s]*$/;

  constructor(private translateService: TranslateService) { }

  ngOnInit(): void {
    this.getLangs();
    this.selectedSrcLang = this.langs[0]
    this.selectedTgtLang = this.langs[1]
    this.selectedType = "text"
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
        this.placeholderTgt = "Аиҭагара";
        this.isReadOnlyTgt = true;
        return;
      }
      if (!this.tgt)
        this.placeholderTgt = "Аиҭагара иаҿуп";
      else
        this.tgt = this.tgt + "..."
      // Here we add HTTP implementation
      this.getTranslate()
      this.isReadOnlyTgt = false;
    }
    else if (this.selectedType === "doc") {
      if (this.file) {
        this.getTranslate()
      }
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
        .subscribe(data => this.downloadLink = data["downloadLink"]);
    }
  }

  getRead() {
    const formData = new FormData();
    formData.append('langSrc', this.selectedSrcLang.id);
    formData.append('photo', this.photo);
    this.translateService.getRead(formData)
      .subscribe(data => this.src = data["source"]);
  }
}
