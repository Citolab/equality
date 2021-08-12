import { Component, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { timer, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { SelfEvalResponseType } from '@equality/data';

@Component({
  selector: 'equality-satisfaction-indicator',
  templateUrl: './satisfaction-indicator.component.html',
  styleUrls: ['./satisfaction-indicator.component.css']
})
export class SatisfactionIndicatorComponent implements OnDestroy {
  @Input() value: SelfEvalResponseType;
  @Input() satisfactionLevel = 0;
  satifactionLevelDisplayValue = 0;
  timerSubscription: Subscription;
  constructor(private ref: ChangeDetectorRef) {
    this.timerSubscription = timer(1).pipe(
      take(1),
      map(() => {
        this.satifactionLevelDisplayValue = this.satisfactionLevel;
        this.ref.detectChanges();
      })).subscribe();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  getClassName() {
    if (!this.value) { return 'indicator-nofill'; }
    if (this.value === SelfEvalResponseType.No) { return 'indicator-no'; }
    if (this.value === SelfEvalResponseType.Yes) { return 'bg-dark'; }
    return '';
  }
}
