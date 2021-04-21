import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LANGS } from './languages';
import { Lang } from './language';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  // private translateUrl = 'https://nartlinux.pythonanywhere.com/translate';  // URL to web api
  private translateUrl = 'https://big-oxygen-281010.uc.r.appspot.com/translate';  // URL to web api
  private readUrl = 'https://nartlinux.pythonanywhere.com/read';  // URL to web api
  private starUrl = 'https://nartlinux.pythonanywhere.com/star';  // URL to web api

  constructor(private http: HttpClient) { }

  getLangs(): Lang[] {
    return LANGS;
  }

  getTranslate(data: FormData): Observable<string> {
    return this.http.post<any>(this.translateUrl, data)
  }

  getRead(data: FormData): Observable<string> {
    return this.http.post<any>(this.readUrl, data)
  }

  setStar(data: FormData): Observable<string> {
    return this.http.post<any>(this.starUrl, data)
  }
}
