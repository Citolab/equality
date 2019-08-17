import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { UserService } from 'src/shared/services/user.service';
import { AuthenticationResultType } from 'src/shared/model/enums';
import { Router } from '@angular/router';
import { take, map } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html'
})
export class LoginComponent {
  loginFailed = false;
  loginForm: FormGroup;
  forgotPasswordMode = false;
  sendPassword = false;
  resetEmail = '';
  constructor(private userService: UserService, private router: Router) {
    this.userService.logout(false);
    this.loginForm = new FormGroup({
      email: new FormControl(),
      password: new FormControl
    });
  }
  login(value: any) {
    this.userService.login(value.email, value.password).then(result => {
      this.loginFailed = !(result === AuthenticationResultType.LoginSuccess);
      if (!this.loginFailed) {
        this.router.navigate(['course']);
      }
    });
  }
  sendPasswordResetMail = (value: any) => this.userService.sendPasswordResetMail(value.email)
    .then(_ => {
      this.sendPassword = true;
      this.resetEmail = value.email;
    })

  forgotPassword = () => this.forgotPasswordMode = true;
  backToLogin = () => {
    this.forgotPasswordMode = false;
    this.sendPassword = false;
  }
}
