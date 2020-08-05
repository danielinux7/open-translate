import { Component, OnInit } from '@angular/core';
import { LANGS } from '../languages';
import { Lang } from '../language';

@Component({
  selector: 'translate',
  templateUrl: './translate.component.html',
  styleUrls: ['./translate.component.css']
})
export class TranslateComponent implements OnInit {
  langs = LANGS
  selectedSrcLang: Lang;
  selectedTgtLang: Lang;
  temp: Lang;
  src: string;
  tgt: string;
  placeholderTgt = "Аиҭагара"
  isReadOnlyTgt = true
  // regular expression for lines with only white spaces
  regexp: RegExp = /^[\t\r\n\s]*$/;

  ngOnInit(): void {
    this.selectedSrcLang = this.langs[0]
    this.selectedTgtLang = this.langs[1]
  }
  onSelectSrc(lang: Lang): void {
    if(lang === this.selectedTgtLang){
      this.temp = this.selectedSrcLang
      this.selectedSrcLang = this.selectedTgtLang;
      this.selectedTgtLang = this.temp;
    }
    else
      this.selectedSrcLang = lang;
  }
  onSelectTgt(lang: Lang): void {
    if(lang === this.selectedSrcLang) {
      this.temp = this.selectedSrcLang
      this.selectedSrcLang = this.selectedTgtLang;
      this.selectedTgtLang = this.temp;
    }
    else
      this.selectedTgtLang = lang;
  }
  onSwap(){
    this.temp = this.selectedSrcLang
    this.selectedSrcLang = this.selectedTgtLang;
    this.selectedTgtLang = this.temp;
  }
  onTranslate(){
    if (!this.src || this.regexp.test(this.src)){
        this.placeholderTgt = "Аиҭагара";
        this.isReadOnlyTgt = true;
        return;
    }
    if (!this.tgt)
      this.placeholderTgt = "Аиҭагара иаҿуп";
    else
      this.tgt = this.tgt + "..."
    // Here we add HTTP implementation
    this.isReadOnlyTgt = false;
  }
}
