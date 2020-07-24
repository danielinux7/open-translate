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
  onSelectSrc(lang: Lang): void {
    this.selectedSrcLang = lang;
  }
  onSelectTgt(lang: Lang): void {
    this.selectedTgtLang = lang;
  }
  ngOnInit(): void {
    // debugger
  }
}
