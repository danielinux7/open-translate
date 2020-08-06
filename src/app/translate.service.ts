import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LANGS } from './languages';
import { Lang } from './language';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  test = "This is a simple test!"
  constructor() { }

  getLangs(): Lang[] {
    return LANGS;
  }

  getTranslate(): Observable<string> {
    return of(this.test);
  }
}
