import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CourseComponent } from './course/course.page';
import { AssessmentComponent } from './assessment/assessment.page';
import { PhaseComponent } from './assessment/components/phase-component/phase-component.component';
import { AssessmentDeliveryDataComponent } from './assessment/components/assessment-delivery-data/assessment-delivery-data.component';



@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: CourseComponent,
                canActivate: [AuthGuard]
            },
            {
                path: ':coursecode',
                component: CourseComponent,
                canActivate: [AuthGuard]
            },
            {
                path: ':coursecode/assessment/:id',
                component: AssessmentComponent,
                canActivate: [AuthGuard],
                children: [{
                    path: 'phase/:title',
                    component: PhaseComponent
                },
                {
                    path: 'toetsdata',
                    component: AssessmentDeliveryDataComponent
                }]
            }
        ])
    ],
    exports: [RouterModule]
})
export class MyCoursesRoutingModule { }
