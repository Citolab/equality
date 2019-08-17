import { Component, OnInit, Input } from '@angular/core';
import { ClaimResponseType } from 'src/shared/model/enums';
import { Observable, timer, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-satisfaction-indicator',
  templateUrl: './satisfaction-indicator.component.html',
  styleUrls: ['./satisfaction-indicator.component.css']
})
export class SatisfactionIndicatorComponent implements OnInit {

  @Input() value: ClaimResponseType;
  @Input() satisfactionLevel = 0;

  s = of(0);

  claimResponseType = ClaimResponseType;

  constructor() {
    this.s = timer(1).pipe(map(() => {
      return this.satisfactionLevel;
    }));
  }

  ngOnInit() {
  }

  getClassName() {
    if (!this.value) { return 'indicator-nofill'; }
    if (this.value === ClaimResponseType.NA) { return 'indicator-na'; }
    if (this.value === ClaimResponseType.No) { return 'indicator-no'; }
    if (this.value === ClaimResponseType.Yes) { return 'bg-dark'; }
  }
}
