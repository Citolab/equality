import { UserService } from '../../../shared/services/user.service';
import { CourseWithEndTermCoverage, AssessmentForm, EndTerm, CourseReference, group } from '@equality/data';
import { Component, OnDestroy, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import {
  LoadEndTermDashboardAction, DashboardState, CategoryWithEndTerms,
  FilterAssessmentTypeAction,
  CourseWithEndTermCoverageInCategories
} from '../../../shared/store/dashboard.state';

export interface AssessmentType {
  key: AssessmentForm;
  title: string;
  shorttitle: string;
  icon: string;
  color: string;
  selected: boolean;
  covered: boolean;
  total: number;
}

@Component({
  selector: 'equality-eindtermen',
  templateUrl: './eindtermen.component.html',
  styleUrls: ['./eindtermen.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EindtermenComponent implements OnDestroy {
  loaded$: Observable<boolean>;
  coursesInYears: Array<{ year: number, courses: CourseWithEndTermCoverageInCategories[] }>;

  assessmentTypesIcon: Map<AssessmentForm, { description: string, short: string, icon: string, color: string }> =
    new Map([
      ['D', { description: 'Digitaal examen', short: 'Digitaal', icon: 'mdi-desktop-classic', color: '#c0c9da' }],
      ['S', { description: 'Schriftelijk examen', short: 'Schriftelijk', icon: 'mdi-lead-pencil', color: '#c0c9da' }],
      ['FT', { description: 'Formatieve toets', short: 'Formatief', icon: 'mdi-face-profile', color: '#c0c9da' }],
      ['O', { description: 'Opdracht', short: 'Opdracht', icon: 'mdi-clipboard-account-outline', color: '#c0c9da' }],
      ['WB', { description: 'Werkplekbeoordeling', short: 'Werkplek', icon: 'mdi-hand', color: '#c0c9da' }],
      ['PRES', { description: 'Presentatie', short: 'Presentatie', icon: 'mdi-presentation', color: '#c0c9da' }],
      ['OV', { description: 'Onderzoeksverslag', short: 'Onderzoek', icon: 'mdi-newspaper', color: '#c0c9da' }],
      ['V', { description: 'Verslag', short: 'Verslag', icon: 'mdi-file-document', color: '#c0c9da' }],
      ['FB', { description: 'Feedbackgesprek', short: 'Feedback', icon: 'mdi-message', color: '#c0c9da' }],
    ]);
  assessmentTypes: AssessmentType[];
  assessmentTooltipTypes: AssessmentForm[];
  selectedAssessmentForms: AssessmentForm[];
  isEindtermen: boolean;
  endTermInCategory: CategoryWithEndTerms[];
  urlSubscription: Subscription;
  assessmentCoverage: [{ coverage: number, selected: boolean }];

  constructor(public userService: UserService, public store: Store, route: ActivatedRoute) {
    this.isEindtermen = route.snapshot.url[0].path === 'eindtermen';
    this.store.dispatch(new LoadEndTermDashboardAction(userService.user.programs[0].code));
    this.loaded$ = this.store.select(DashboardState.endTerms).pipe(
      filter(endTermData => !!endTermData),
      map((endTermData) => {
        this.coursesInYears = Array.from(group(endTermData.courses,
          (d: { leerjaar: number }) => d.leerjaar), ([year, courses]) =>
          ({ year, courses }));
        this.endTermInCategory = endTermData.categories;
        this.selectedAssessmentForms = endTermData.selectedAssessmentForms;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.assessmentTypes = this.getAssessmentTypes(endTermData.courses as any[]);
        return true;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.urlSubscription) {
      this.urlSubscription.unsubscribe();
    }
  }

  allSelected() {
    return !this.assessmentTypes.find(a => !a.selected);
  }

  select(select: boolean) {
    this.store.dispatch(new FilterAssessmentTypeAction(select ?
      this.assessmentTypes.map(c => c.key) as AssessmentForm[] :
      []));
  }

  selectAssessmentType(assessmentType: AssessmentType) {
    const selectedTypes = (assessmentType.selected ?
      this.assessmentTypes
        .filter(c => c.selected && c.key !== assessmentType.key)
        .map(c => c.key) :
      [...this.assessmentTypes
        .filter(c => c.selected)
        .map(c => c.key), assessmentType.key]) as AssessmentForm[];

    this.store.dispatch(new FilterAssessmentTypeAction(selectedTypes));
  }

  setCurrentForms(assessmentForms: AssessmentForm[]) {
    this.assessmentTooltipTypes = assessmentForms;
  }

  private getAssessmentTypes(courses: CourseWithEndTermCoverage[]) {
    const myTypes: AssessmentType[] = [];

    let iconIndex = 0;
    this.assessmentTypesIcon.forEach(((info, key) => {
      const coveredByCoursesTotal = (courses ?
        courses.map(c => c.assessmentFormCoverage[iconIndex]) : [])
        .reduce((a, b) => a + b, 0);
      myTypes.push({
        key,
        icon: info.icon,
        title: info.description,
        selected: this.selectedAssessmentForms ? this.selectedAssessmentForms.indexOf(key) !== -1 : false,
        covered: coveredByCoursesTotal > 0,
        color: info.color,
        total: coveredByCoursesTotal,
        shorttitle: info.short
      });
      iconIndex++;
    }));
    return myTypes;
  }

  trackByCursus:TrackByFunction<any> = (index: number, item: CourseReference) => item?.code || index;
  trackByEndterm:TrackByFunction<any> = (index: number, item: EndTerm) => item?.code || index;
  trackByCategory:TrackByFunction<any> = (index: number, item: CategoryWithEndTerms) => item?.category || index;
  trackByCourseYear:TrackByFunction<any> = (index: number, item: CourseWithEndTermCoverage) => item?.code || index;
  trackByAssessmentType:TrackByFunction<any> = (index: number, item: AssessmentType) => item?.key || index;
}
