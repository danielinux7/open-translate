import { Injectable } from '@angular/core';
import { LANGS } from './languages';
import { Lang } from './language';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {

  constructor() { }

  getLangs(): Lang[] {
  return LANGS;
}
}
