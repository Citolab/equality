import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private router: Router, private toastrService: ToastrService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap((event: HttpEvent<any>) => {}, (err: any) => {
            if (err instanceof HttpErrorResponse) {
                // if (err.status === 401 || err.status === 403) {
                //     this.router.navigate(['login']);
                // }
                if (!environment.production) {
                    this.toastrService.error(err.message);
                }
            }
        }));
    }
}
