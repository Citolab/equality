import { NgModule } from '@angular/core';
import { LoginComponent } from './login.page';
import { SharedModule } from 'src/shared/shared.module';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [SharedModule, RouterModule.forChild([
        {
            path: 'login',
            component: LoginComponent,
        }
    ])],
    declarations: [LoginComponent],
    exports: [LoginComponent]
})

export class LoginModule { }
