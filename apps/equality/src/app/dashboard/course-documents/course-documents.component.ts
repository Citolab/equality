import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CourseReference, CourseWithDocumentCoverage, group } from '@equality/data';
import { UserService } from '../../../shared/services/user.service';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoadDocumentsAction, DashboardState } from '../../../shared/store/dashboard.state';

export interface YearWithCourseDocumentCoverages {
  year: number;
  courses: CourseWithDocumentCoverage[];
}

@Component({
  selector: 'equality-course-documents',
  templateUrl: './course-documents.component.html',
  styleUrls: ['./course-documents.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseDocumentsComponent {
  public yearsWithCourseDocumentCoverages: YearWithCourseDocumentCoverages[];
  documentTypes: string[] = [];
  loaded$: Observable<boolean>;

  constructor(public userService: UserService, store: Store) {
    const programCode = this.userService.user.programs[0].code;

    store.dispatch(new LoadDocumentsAction(programCode));
    this.loaded$ = store.select(DashboardState.documents).pipe(map(data => {
      if (data && data.documentTypes && data.documentTypes.length > 0) {
        this.documentTypes = data.documentTypes;
        this.yearsWithCourseDocumentCoverages = Array.from(
          group(data.coursesWithDocumentCoverages, (d: CourseReference) => d.leerjaar),
          ([year, courses]) => ({ year, courses }));
        return true;
      }
      return false;
    }));
  }
  trackByYear(index: number, item: YearWithCourseDocumentCoverages) {
    return item && item.year || index;
  }

  trackByCourse(index: number, item: CourseReference) {
    return item && item.code || index;
  }

  trackByFile(index: number) {
    return index;
  }
}
