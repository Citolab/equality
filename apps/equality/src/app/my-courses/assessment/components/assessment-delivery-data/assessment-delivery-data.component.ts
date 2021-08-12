import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DeliveryData } from '@equality/data';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { CourseState, UpdateDeliveryDataAction } from '../../../../../shared/store/course.state';
import { UserService } from '../../../../../shared/services/user.service';

@Component({
  selector: 'equality-assessment-delivery-data',
  templateUrl: './assessment-delivery-data.component.html',
  styleUrls: ['./assessment-delivery-data.component.scss']
})
export class AssessmentDeliveryDataComponent implements OnDestroy {
  public data: DeliveryData;
  public formControlSubscription: Subscription;
  public assessmentDataForm: FormGroup;
  public readonlyMode = false;
  public fields = [
    { id: 'alpha', title: 'Alpha (α)', sign: '', minValue: 0, maxValue: 1, pattern: /^((0\.?(\d+)?)|1\.?)$/ },
    { id: 'itemCount', title: 'Aantal vragen', sign: '', minValue: 0, maxValue: 10000, pattern: /^(0|[1-9]\d*)$/ },
    { id: 'studentCount', title: 'Aantal studenten', sign: '', minValue: 0, maxValue: 100000, pattern: /^(0|[1-9]\d*)$/ },
    { id: 'average', title: 'Gemiddeld cijfer', sign: '', minValue: 0, maxValue: 10, pattern: /^[1-9]\.?(\d+)?$/ },
    { id: 'standardDeviation', title: 'Standaarddeviatie', sign: '', minValue: 0, maxValue: 10, pattern: /^[0-9]\d*\.?(\d+)?$/ },
    {
      id: 'percentagePassed', title: 'Slagingspercentage (%)', sign: '', minValue: 0, maxValue: 100,
      pattern: /^(([1-9]\d?\.?(\d+)?))$/
    },
  ];

  constructor(private store: Store, userService: UserService) {
    this.readonlyMode = userService.isExamencommissie;
    this.assessmentDataForm = new FormGroup({});
    this.store.select(CourseState.deliveryData).pipe(take(1)).subscribe((data:any) => {
      this.data = data;
      this.fields.forEach(f => {
        this.assessmentDataForm.addControl(`${f.id}-applicable`, new FormControl(!data[f.id].applicable));
        this.assessmentDataForm.addControl(f.id, new FormControl(data[f.id].value,
          [Validators.pattern(f.pattern), Validators.min(f.minValue), Validators.max(f.maxValue)]));
        if (!data[f.id].applicable) {
          this.assessmentDataForm.get(f.id).disable();
        }
        if (this.readonlyMode) {
          this.assessmentDataForm.get(f.id).disable();
          this.assessmentDataForm.get(`${f.id}-applicable`).disable();
        }
      });
      this.formControlSubscription = this.assessmentDataForm.valueChanges.subscribe(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = DeliveryData.create() as any;
        this.fields.forEach(f => {
          const aControl = this.assessmentDataForm.get(`${f.id}-applicable`);
          const vControl = this.assessmentDataForm.get(f.id);
          if (vControl.value && vControl.value.toString().indexOf(',') !== -1) {
            vControl.setValue(vControl.value.replace(',', '.'));
          }
          d[f.id].applicable = !aControl.value;

          if (aControl.value && vControl.value !== '') { vControl.setValue(''); }
          if (!vControl.errors) {
            d[f.id].value = vControl.value;
          } else {
            d[f.id].value = data[f.id] ? data[f.id].value : 0;
          }

          if (!d[f.id].applicable) {
            vControl.disable({ emitEvent: false });
          } else {
            vControl.enable({ emitEvent: false });
          }
        });
        this.store.dispatch(new UpdateDeliveryDataAction(d));
      });
    });

  }

  getFieldError(fieldId: string, title: string) {
    const applicable = !this.assessmentDataForm.get(`${fieldId}-applicable`).value;
    const formErrors = (this.assessmentDataForm.get(fieldId) as FormControl).errors;
    if (!applicable) { return null; }

    if (formErrors) {
      if (formErrors.max || formErrors.min) {
        return formErrors.max ?
          `${title} heeft de waarde ${formErrors.max.actual} maar mag maximaal ${formErrors.max.max} zijn` :
          `${title} heeft de waarde ${formErrors.min.actual} maar moet minimaal ${formErrors.min.min} zijn`;
      }
      if (formErrors.pattern) {
        return `ongeldige waarde ingevuld bij ${title}.`;
      }
    }
    return null;
  }


  ngOnDestroy(): void {
    if (this.formControlSubscription) {
      this.formControlSubscription.unsubscribe();
    }
  }

}
