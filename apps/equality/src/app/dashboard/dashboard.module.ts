import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DashboardComponent } from './dashboard.page';
import { FilterCoursesComponent } from './filter-courses/filter-courses.component';
import { CourseDocumentsComponent } from './course-documents/course-documents.component';
import { EindtermenComponent } from './eindtermen/eindtermen.component';
import { ScrollPointModule } from './directives/scroll-point.directive';
import { ChartsModule } from 'ng2-charts';
import { DeliveryDataComponent } from './delivery-data/delivery-data.component';

import { ReliabilityChartComponent } from './delivery-data/reliability-chart/reliability-chart.component';
import { AverageGradeChartComponent } from './delivery-data/average-grade-chart/average-grade-chart.component';
import { SuccessPercentageComponent } from './delivery-data/success-percentage/success-percentage.component';
import { SelfEvalComponent } from './self-evaluation/self-evaluation.component';
import { VisionDocumentsComponent } from './vision-documents/vision-documents.component';
import { CourseLinkComponent } from './course-link.component';
import { SelfEvaluateCategoryComponent } from './self-evaluation/self-evaluate-category/self-evaluate-category.component';

@NgModule({
    imports: [ChartsModule, SharedModule, NgbDropdownModule, ScrollPointModule,
        RouterModule.forChild([
        {
            path: '',
            component: DashboardComponent,
            canActivate: [AuthGuard],
            children: [
                {
                    path: 'toetsdata',
                    component: DeliveryDataComponent
                },
                {
                    path: 'toetsdocumenten',
                    component: CourseDocumentsComponent
                },
                {
                    path: '', redirectTo: 'toetsdocumenten'
                },
                {
                    path: 'eindtermen',
                    component: EindtermenComponent
                },
                {
                    path: 'toetsvorm',
                    component: EindtermenComponent
                },
                {
                    path: 'zelfevaluatie',
                    component: SelfEvalComponent
                }
            ]
        },
    ])],
    providers: [AuthGuard],
    declarations: [DashboardComponent, FilterCoursesComponent, CourseDocumentsComponent, SelfEvalComponent, VisionDocumentsComponent,
        EindtermenComponent, SelfEvaluateCategoryComponent,
         DeliveryDataComponent, ReliabilityChartComponent, AverageGradeChartComponent, SuccessPercentageComponent,
        CourseLinkComponent],
    exports: [DashboardComponent],
    entryComponents: [VisionDocumentsComponent]
})

export class DashboardModule {
}
