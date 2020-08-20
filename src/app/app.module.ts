import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { TranslateComponent } from './translate/translate.component';
import { FooterComponent } from './footer/footer.component';
import { TranslateTypeComponent } from './translate-type/translate-type.component';

@NgModule({
  declarations: [
    AppComponent,
    NavBarComponent,
    TranslateComponent,
    FooterComponent,
    TranslateTypeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
