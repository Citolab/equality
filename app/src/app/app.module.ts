import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID } from '@angular/core';
import { APP_BASE_HREF, LocationStrategy, HashLocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { HttpClient, HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ToastrModule } from 'ngx-toastr';
import { ErrorInterceptor } from 'src/shared/interceptors/error.interceptor';
import { environment } from '../environments/environment';

import { SharedModule } from 'src/shared/shared.module';
import { AppRoutingModule } from './app-routing.module';

import { LoginModule } from './login/login.module';
import { AssessmentModule } from './assessment/assessment.module';
import { AngularFireModule } from '@angular/fire';
import { NgxsModule } from '@ngxs/store';
import { CourseState } from 'src/shared/store/course.state';
import { NgxsActionLoggerToBackendPluginModule } from 'src/shared/store/action-logger';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { CourseModule } from './course/course.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    HttpClientModule, AppRoutingModule, BrowserAnimationsModule,
    LoginModule, AssessmentModule, CourseModule,
    BrowserModule, ToastrModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebase),
    SharedModule.forRoot(),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    NgxsModule.forRoot([CourseState]),
    NgxsActionLoggerToBackendPluginModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })],
  providers: [
    { provide: LOCALE_ID, useValue: 'nl-NL' },
    { provide: APP_BASE_HREF, useValue: '/' },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
