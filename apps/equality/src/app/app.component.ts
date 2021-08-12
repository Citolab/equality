import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../shared/services/user.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'equality-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isCourse = false;
  constructor(translate: TranslateService, public userService: UserService, router: Router) {
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('en');

    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(navEvent => {
      this.isCourse = (navEvent as NavigationEnd).url.indexOf('/course') !== -1;
    });
  }

  logout = () => this.userService.logout();
}
