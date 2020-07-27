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
  
  ngOnInit(): void {
    this.selectedSrcLang = this.langs[0]
    this.selectedTgtLang = this.langs[1]
  }
  onSelectSrc(lang: Lang): void {
    if(lang !== this.selectedTgtLang)
      this.selectedSrcLang = lang;
  }
  onSelectTgt(lang: Lang): void {
    if(lang !== this.selectedSrcLang)
      this.selectedTgtLang = lang;
  }
  onSwap(){
    this.temp = this.selectedSrcLang
    this.selectedSrcLang = this.selectedTgtLang;
    this.selectedTgtLang = this.temp;
  }
}
