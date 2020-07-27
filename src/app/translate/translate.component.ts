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

  ngOnInit(): void {
    this.selectedSrcLang = this.langs[0]
    this.selectedTgtLang = this.langs[1]
    this.tgt = "Аиҭагара"
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
  }
}
