import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { BackofficeComponent } from './backoffice.component';
import { AuthGuard } from '../../shared/guards/auth.guard';

@NgModule({
    imports: [SharedModule,
        RouterModule.forChild([
        {
            path: '',
            component: BackofficeComponent,
            canActivate: [AuthGuard]
        },
    ])],
    providers: [AuthGuard],
    declarations: [BackofficeComponent],
    exports: [BackofficeComponent]
})

export class BackofficeModule {
}
