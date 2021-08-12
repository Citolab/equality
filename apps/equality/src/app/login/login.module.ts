import { NgModule } from '@angular/core';
import { LoginComponent } from './login.page';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    declarations: [LoginComponent],
    imports: [
        SharedModule,
        RouterModule.forChild([
            {
                path: '',
                redirectTo: '/login',
                pathMatch: 'full'
            },
            {
                path: 'login',
                component: LoginComponent,
                canActivate: []
            }
        ])
    ],
    exports: [RouterModule]
})

export class LoginModule { }
