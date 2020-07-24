import { Component, OnInit } from '@angular/core';
import { LANGS } from '../languages';

@Component({
  selector: 'translate',
  templateUrl: './translate.component.html',
  styleUrls: ['./translate.component.css']
})
export class TranslateComponent implements OnInit {
  langs = LANGS
  constructor() { }

  ngOnInit(): void {
  }

}
