import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngxs/store';
import { DashboardState, CourseForFilter, FilterCoursesAction } from '../../shared/store/dashboard.state';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '../../shared/services/user.service';
import { ProgramWithData } from '@equality/data';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VisionDocumentsComponent } from './vision-documents/vision-documents.component';

@Component({
  selector: 'equality-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  loaded$ = of(false);
  programLoaded$ = of(false);
  tabs = [
    { title: 'End terms', disabled: true, url: 'Eindtermen' },
    { title: 'Assessment formats', disabled: true, url: 'Toetsvorm'  },
    { title: 'Assessment data', disabled: true, url: 'Toetsdata'  },
    { title: 'Self evaluation', disabled: true, url: 'Zelfevaluatie'  },
    { title: 'Assessment documents', disabled: false, url: 'Toetsdocumenten'  }
  ];
  program: ProgramWithData;
  courses: CourseForFilter[];
  isEmpty = false;

  constructor(private store: Store, private userService: UserService, private modalService: NgbModal) {
    this.loaded$ = store.select(DashboardState.courses).pipe(
      map((courses) => {

        this.courses = courses;
        this.isEmpty = courses && !courses.find(c => c.selected);
        return true;
      }));
    this.programLoaded$ = store.select(DashboardState.program).pipe(map(program => {
      this.program = program;
      return true;
    }));
  }

  openVisionDocuments() {
    this.modalService.open(VisionDocumentsComponent, { size: 'lg', backdropClass: 'blur-background' });
  }

  filterChanged(selectedCourseCodes: string[]) {
    this.store.dispatch(new FilterCoursesAction(this.userService.user.programs[0].code,
      selectedCourseCodes));
  }
}



