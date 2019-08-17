import { NgModule } from '@angular/core';
import { CourseComponent } from './course.page';
import { SharedModule } from 'src/shared/shared.module';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { CourseService } from 'src/shared/services/course.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Phase } from 'src/shared/model/model';

@NgModule({
    imports: [SharedModule, NgbDropdownModule, RouterModule.forChild([
        {
            path: '',
            redirectTo: '/course',
            pathMatch: 'full'
        },
        {
            path: 'course',
            component: CourseComponent,
            canActivate: [AuthGuard]
        }
    ])],
    providers: [AuthGuard, CourseService],
    declarations: [CourseComponent],
    exports: [CourseComponent]
})

export class CourseModule {
}
