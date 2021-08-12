import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Options } from '@angular-slider/ngx-slider';
import { SelfEvalResponseType } from '@equality/data';

@Component({
    selector: 'equality-eval-response',
    styleUrls: ['./selfevalresponse.component.scss'],
    templateUrl: './selfevalresponse.component.html',
})
export class SelfEvalResponseComponent implements OnChanges, OnDestroy {
    // Inputs
    @Input() disabled = false;
    @Input() text: string;
    @Input() code: string;
    @Input() phase: string;
    @Input() satisfactionLevel: number;
    @Input() responseType: SelfEvalResponseType;
    // Outputs
    @Output() changed = new EventEmitter<SelfEvalResponseEvent>();

    questionForm: FormGroup;
    selfEvalResponseTypeControl: FormControl;
    satisfactionControl: FormControl;

    sliderOptions: Options = {
        animate: false,
        floor: 0,
        ceil: 100,
        vertical: false,
        showSelectionBar: true,
        hideLimitLabels: true,
        hidePointerLabels: true,
        disabled: true,
    };

    private valueChangedForSaveSubScription: Subscription;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes && changes.phase && changes.phase.isFirstChange ||
            changes && changes.phase && changes.phase.currentValue !== changes.phase.previousValue) {
            if (this.valueChangedForSaveSubScription) {
                this.valueChangedForSaveSubScription.unsubscribe();
            }
            this.selfEvalResponseTypeControl = new FormControl(this.responseType);
            this.satisfactionControl = new FormControl(this.satisfactionLevel);

            this.questionForm = new FormGroup({
                evalResponseType: this.selfEvalResponseTypeControl,
                satisfactionLevel: this.satisfactionControl
            });
            this.sliderOptions = {
                ...this.sliderOptions, disabled: this.disabled || !this.selfEvalResponseTypeControl.value
            };
            if (!this.disabled) {
                this.valueChangedForSaveSubScription = this.questionForm.valueChanges
                    .subscribe(_ => {
                        this.sliderOptions = { ...this.sliderOptions, disabled: !this.selfEvalResponseTypeControl.value };
                        this.changed.emit({
                            selfEvalCode: this.code,
                            selfEvalResponseType: +this.selfEvalResponseTypeControl.value,
                            satisfactionLevel: +this.satisfactionControl.value
                        } as SelfEvalResponseEvent);
                    });
            }
        }
    }

    ngOnDestroy(): void {
        if ( this.valueChangedForSaveSubScription) {
            this.valueChangedForSaveSubScription.unsubscribe();
        }
    }
}


export class SelfEvalResponseEvent {
    selfEvalCode: string;
    selfEvalResponseType: SelfEvalResponseType;
    satisfactionLevel: number;
}
