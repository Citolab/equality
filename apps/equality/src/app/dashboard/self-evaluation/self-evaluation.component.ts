import { Component, ChangeDetectionStrategy } from '@angular/core';
import {  NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import {
  CourseReference, CourseWithSelfEvalCountsPerCategory, CategoryWithSelfEval,
  CategoryWithResponseCounts, group
} from '@equality/data';
import { UserService } from '../../../shared/services/user.service';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardState, LoadSelfEvaluationAction } from '../../../shared/store/dashboard.state';

export interface YearWithCourseWithSelfEvalCountsPerCategory {
  year: number;
  courses: CourseWithSelfEvalCountsPerCategory[];
}

@Component({
  selector: 'equality-self-evaluation',
  templateUrl: './self-evaluation.component.html',
  styleUrls: ['./self-evaluation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelfEvalComponent {
  public yearsWithCourseSelfEvalCountsPerPhase: YearWithCourseWithSelfEvalCountsPerCategory[];
  categories: CategoryWithSelfEval[] = [];
  popContent: string[] = [];
  loaded$: Observable<boolean>;

  constructor(public userService: UserService, store: Store) {
    const programCode = this.userService.user.programs[0].code;

    store.dispatch(new LoadSelfEvaluationAction(programCode));
    this.loaded$ = store.select(DashboardState.selfEvalCounts).pipe(map(program => {
      if (program) {
        this.categories = program.categories;
        this.yearsWithCourseSelfEvalCountsPerPhase = Array.from(
          group(program.coursesWithSelfEvalCountsPerCategory, (d: CourseReference) => d.leerjaar),
          ([year, courses]) => ({ year, courses }));
        return true;
      }
      return false;
    }));
  }

  setStellingen(popover: NgbPopover, category: CategoryWithSelfEval) {
    if (popover.isOpen()) {
      popover.close();
    } else {
      popover.open({ stellingen: category.evals.map(ev => ev.title) });
    }
  }

  trackByYear(index: number, item: YearWithCourseWithSelfEvalCountsPerCategory) {
    return item ? item.year : index;
  }

  trackByCourse(index: number, item: CourseReference) {
    return item ? item.code : index;
  }

  trackByCategory(index: number, category: CategoryWithSelfEval | CategoryWithResponseCounts) {
    return category ? category.title : index;
  }
}
