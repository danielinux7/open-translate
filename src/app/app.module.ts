import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { TranslateComponent } from './translate/translate.component';
import { FooterComponent } from './footer/footer.component';
import { ClipboardModule } from 'ngx-clipboard';
import { CookieService} from 'ngx-cookie-service';
import { DubComponent } from './dub/dub.component';
import { RouterModule } from '@angular/router';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatBadgeModule} from '@angular/material/badge';
import {ProgressBarColor} from './dub/progress-bar-color';

@NgModule({
  declarations: [
    AppComponent,
    NavBarComponent,
    TranslateComponent,
    FooterComponent,
    DubComponent,
    ProgressBarColor
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ClipboardModule,
    MatProgressBarModule,
    MatBadgeModule,
    RouterModule.forRoot([
    {path: '', component: TranslateComponent},
    {path: 'dub', component: DubComponent},
    {path: '**', redirectTo: '', pathMatch: 'full'}
    ])
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
