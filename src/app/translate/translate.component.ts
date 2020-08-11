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
  src: string;
  tgt: string;
  data: string;
  placeholderTgt = "Аиҭагара"
  isReadOnlyTgt = true
  // regular expression for lines with only white spaces
  regexp: RegExp = /^[\t\r\n\s]*$/;

  constructor(private translateService: TranslateService) { }

  ngOnInit(): void {
    this.getLangs();
    this.selectedSrcLang = this.langs[0]
    this.selectedTgtLang = this.langs[1]
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
    this.selectedSrcLang = this.selectedTgtLang;
    this.selectedTgtLang = this.temp;
  }

  onTranslate() {
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

  // fucntions to call the translate services
  getLangs(): void {
    this.langs = this.translateService.getLangs();
  }

  getTranslate(): void {
    this.data = "langSrc=" + this.selectedSrcLang.id + "&langTgt=" + this.selectedTgtLang.id + "&source=" + this.src
    this.translateService.getTranslate(this.data)
      .subscribe(data => this.tgt = data["target"]);
  }
}
