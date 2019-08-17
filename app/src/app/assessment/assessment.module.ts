import { NgModule } from '@angular/core';
import { AssessmentComponent } from './assessment.page';
import { SharedModule } from 'src/shared/shared.module';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { CourseService } from 'src/shared/services/course.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ClaimResponseComponent } from './components/claimresponse/claimresponse.component';
import { Ng5SliderModule } from 'ng5-slider';
import { PhaseComponent } from './components/phase-component/phase-component.component';
// you should allow cors to download in the browser see: // https://firebase.google.com/docs/storage/web/download-files
// TODO for production this should only be the used prod urls.
import { FileSaverModule } from 'ngx-filesaver';

@NgModule({
    imports: [SharedModule, NgbDropdownModule, Ng5SliderModule, FileSaverModule,
        RouterModule.forChild([
        {
            path: 'assessment/:id',
            component: AssessmentComponent,
            canActivate: [AuthGuard],
            children: [{
                path: 'phase/:type',
                component: PhaseComponent
            }]
        }
    ])],
    providers: [AuthGuard, CourseService],
    declarations: [AssessmentComponent, ClaimResponseComponent, PhaseComponent],
    exports: [AssessmentComponent]
})

export class AssessmentModule { }
