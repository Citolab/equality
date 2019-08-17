import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClaimResponseType } from 'src/shared/model/enums';
import { Options } from 'ng5-slider';
import { tap } from 'rxjs/operators';

interface SimpleSliderModel {
    value: number;
    options: Options;
}

@Component({
    selector: 'app-claim-response',
    styleUrls: ['./claimresponse.component.scss'],
    templateUrl: './claimresponse.component.html',
})
export class ClaimResponseComponent implements OnInit, OnDestroy {
    // Inputs
    @Input() text: string;
    @Input() claimResponseType: ClaimResponseType;
    @Input() satisfactionLevel: number;

    // Outputs
    @Output() changed = new EventEmitter<ClaimResponseEvent>();
    questionForm: FormGroup;
    claimResponseTypeControl: FormControl;

    claimResponseTypeEnum = ClaimResponseType;

    verticalSlider5: SimpleSliderModel = {
        value: 3,
        options: {
            floor: 0,
            ceil: 3,
            vertical: true,
            showSelectionBar: true,
            hideLimitLabels: true,
            hidePointerLabels: true,
        }
    };

    private valueChangedForSaveSubScription: Subscription;

    constructor() { }

    ngOnInit(): void {
        this.claimResponseTypeControl = new FormControl(this.claimResponseType);
        this.questionForm = new FormGroup({
            claimResponseType: this.claimResponseTypeControl
        });
        this.valueChangedForSaveSubScription = this.questionForm.valueChanges
            .subscribe(_ => {
                this.changed.emit({
                    claimResponseType: +this.claimResponseTypeControl.value,
                    satisfactionLevel: +this.satisfactionLevel
                });
            });
    }

    ngOnDestroy(): void {
        this.valueChangedForSaveSubScription.unsubscribe();
    }

    satisfactionLevelChanged(e: any) {
        this.changed.emit({
            claimResponseType: +this.claimResponseTypeControl.value,
            satisfactionLevel: +e.value
        });
    }
}


export class ClaimResponseEvent {
    claimResponseType: ClaimResponseType;
    satisfactionLevel: number;
}
