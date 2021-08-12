import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '../services/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.userService.isAuthenticated().pipe(map(authenticated => {
      if (!authenticated) {
        console.log('not authenticated');
        this.router.navigate(['login']);
      }
      return authenticated;
    }));
  }
}
