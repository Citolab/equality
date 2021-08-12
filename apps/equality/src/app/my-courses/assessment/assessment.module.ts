import { NgModule } from '@angular/core';
import { AssessmentComponent } from './assessment.page';
import { SharedModule } from '../../../shared/shared.module';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { SelfEvalResponseComponent } from './components/selfevalresponse/selfevalresponse.component';
import { AssessmentDeliveryDataComponent } from './components/assessment-delivery-data/assessment-delivery-data.component';
import { PhaseComponent } from './components/phase-component/phase-component.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSliderModule } from '@angular-slider/ngx-slider';

@NgModule({
    imports: [SharedModule, NgbDropdownModule, NgxSliderModule],
    providers: [AuthGuard],
    declarations: [AssessmentComponent, SelfEvalResponseComponent,
        PhaseComponent, AssessmentDeliveryDataComponent
    ],
    exports: [AssessmentComponent]
})

export class AssessmentModule { }
