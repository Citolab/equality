import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { AssessmentWithDeliveryData, group } from '@equality/data';
import { Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { UserService } from '../../../shared/services/user.service';
import { LoadAssessmentDeliveryDataAction, DashboardState, FilterGraphTypeAction, CourseForFilter } from '../../../shared/store/dashboard.state';
import { filter, map, withLatestFrom } from 'rxjs/operators';

export interface YearWithCourseDocumentCoverages {
  year: number;
  assessments: AssessmentWithDeliveryData[];
}

@Component({
  selector: 'equality-delivery-data',
  templateUrl: './delivery-data.component.html',
  styleUrls: ['./delivery-data.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryDataComponent implements OnDestroy {
  loaded$: Observable<boolean>;
  graphTypeSubscription: Subscription;
  assessments: AssessmentWithDeliveryData[];
  yearsWithAssessments: YearWithCourseDocumentCoverages[];
  graphTypes = [
    { title: 'Betrouwbaarheid', selected: false, icon: 'mdi-alpha' },
    { title: 'Gemiddeld cijfer', selected: false, icon: 'mdi-numeric' },
    { title: 'Slagingspercentage', selected: false, icon: 'mdi-percent' },
  ];
  courses: CourseForFilter[];

  constructor(private store: Store, public userService: UserService) {
    this.store.dispatch(new LoadAssessmentDeliveryDataAction(userService.user.programs[0].code));

    this.graphTypeSubscription = this.store.select(DashboardState.graphTypes).subscribe(types => {
      this.graphTypes = this.graphTypes.map(graphType => {
        if (types) {
          if (graphType.selected && types.indexOf(graphType.title) === -1) {
            return { ...graphType, selected: false };
          }
          if (!graphType.selected && types.indexOf(graphType.title) !== -1) {
            return { ...graphType, selected: true };
          }
        }
        return graphType;
      });
    });

    this.loaded$ = this.store.select(DashboardState.assessmentDeliveryData).pipe(
      filter(assessmentDeliveryData => !!assessmentDeliveryData),
      withLatestFrom(this.store.select(DashboardState.courses)),
      map(([assessmentDeliveryData, courses]) => {
        this.courses = courses;
        this.assessments = assessmentDeliveryData.assessmentsWithDeliveryData;
        this.yearsWithAssessments = Array.from( // group courses in years
          group(this.assessments, (a: AssessmentWithDeliveryData) => a.leerjaar),
          ([year, assessments]) => ({ year, assessments }));
        return true;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.graphTypeSubscription) {
      this.graphTypeSubscription.unsubscribe();
    }
  }

  trackByYear(index: number, item: YearWithCourseDocumentCoverages) {
    return item ? item.year : index;
  }
  trackByGraphType(index: number, item: { title: string, selected: boolean }) {
    return item ? item.title : index;
  }

  public graphTypeSelected(type: string) {
    const graphType = this.graphTypes.find(g => g.title === type);
    return graphType ? graphType.selected : false;
  }

  public selectGraphType(graphType: { title: string, selected: boolean }) {
    const selectedTypes = (graphType.selected ?
      this.graphTypes
        .filter(c => c.selected && c.title !== graphType.title)
        .map(c => c.title) :
      [...this.graphTypes
        .filter(c => c.selected)
        .map(c => c.title), graphType.title]);

    this.store.dispatch(new FilterGraphTypeAction(this.userService.user.programs[0].code, selectedTypes));
  }
}
