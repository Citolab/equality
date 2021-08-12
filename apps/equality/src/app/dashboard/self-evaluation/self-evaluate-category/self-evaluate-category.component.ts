import { Component, Input, OnChanges, OnDestroy, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { timer, Subscription, of } from 'rxjs';
import { take, mergeMap, tap } from 'rxjs/operators';

@Component({
  selector: 'equality-self-evaluate-category',
  templateUrl: './self-evaluate-category.component.html',
  styleUrls: ['./self-evaluate-category.component.css']
})
export class SelfEvaluateCategoryComponent implements OnChanges, OnDestroy {

  @Input() yesCount: number;
  @Input() noCount: number;
  @Input() unansweredCount: number;


  total = 0;
  yesPercentage = 0;
  noPercentage = 0;
  timerSubscription: Subscription;

  constructor(private ref: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes &&
      (changes && changes.yesCount && changes.yesCount.currentValue !== changes.yesCount.previousValue ||
        changes && changes.noCount && changes.noCount.currentValue !== changes.noCount.previousValue)) {

      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
      }
      this.total = this.yesCount + this.noCount + this.unansweredCount;
      this.timerSubscription = timer(0.5).pipe(
        take(1),
        mergeMap(() => {
          this.yesPercentage = this.getYesPercentage();
          this.ref.detectChanges();
          if (this.yesPercentage === 0) {
            this.noPercentage = this.getNoPercentage();
            this.ref.detectChanges();
            return of(true);
          } else {
            return timer(0.5).pipe(
              take(1),
              tap(() => {
                this.noPercentage = this.getNoPercentage();
                this.ref.detectChanges();
              }));
          }
        })).subscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private getNoPercentage() {
    return Math.round(100 / this.total) * this.noCount;
  }

  private getYesPercentage() {
    return Math.round(100 / this.total) * this.yesCount;
  }

}
