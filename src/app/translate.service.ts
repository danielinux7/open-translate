import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LANGS } from './languages';
import { Lang } from './language';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private translateUrl = 'https://nartlinux.pythonanywhere.com/translate';  // URL to web api
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
  };
  test = "This is a simple test!"
  constructor(private http: HttpClient) { }

  getLangs(): Lang[] {
    return LANGS;
  }

  getTranslate(data: string): Observable<string> {
    return this.http.post<string>(this.translateUrl, data, this.httpOptions)
  }
}
