import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LANGS } from './languages';
import { Lang } from './language';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private translateUrl = 'https://localhost:5000/translate';  // URL to web api
  private convUrl = 'https://localhost:5000/conv';  // URL to web api
  private readUrl = 'https://localhost:5000/read';  // URL to web api
  private starUrl = 'https://localhost:5000/star';  // URL to web api
  
 // private translateUrl = 'https://translate.apsny.land:5000/translate';  // URL to web api
 // private convUrl = 'https://translate.apsny.land:5000/conv';  // URL to web api
 // private readUrl = 'https://translate.apsny.land:5000/read';  // URL to web api
 // private starUrl = 'https://translate.apsny.land:5000/star';  // URL to web api

  constructor(private http: HttpClient) { }

  getLangs(): Lang[] {
    return LANGS;
  }

  getTranslate(data: FormData): Observable<any> {
    return this.http.post<any>(this.translateUrl, data)
  }

  getTranslateDub(data: FormData) {
    return firstValueFrom(this.http.post<any>(this.translateUrl, data))
  }

  getConv(data: FormData): Observable<any> {
    return this.http.post<any>(this.convUrl, data)
  }

  getRead(data: FormData): Observable<string> {
    return this.http.post<any>(this.readUrl, data)
  }

  setStar(data: FormData): Observable<string> {
    return this.http.post<any>(this.starUrl, data)
  }
}
