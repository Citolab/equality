import { NgModule } from '@angular/core';
import { CourseComponent } from './course/course.page';
import { SharedModule } from '../../shared/shared.module';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { MyCoursesRoutingModule } from './my-courses.routing.module';
import { AssessmentModule } from './assessment/assessment.module';

@NgModule({
    imports: [SharedModule, NgbDropdownModule, MyCoursesRoutingModule, AssessmentModule],
    providers: [AuthGuard],
    declarations: [CourseComponent],
    exports: [CourseComponent]
})

export class MyCoursesModule {
}
