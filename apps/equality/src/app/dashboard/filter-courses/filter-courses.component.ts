import { Component, Input, ViewChildren, QueryList, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CourseForFilter } from '../../../shared/store/dashboard.state';


@Component({
  selector: 'equality-filter-courses',
  templateUrl: './filter-courses.component.html',
  styleUrls: ['./filter-courses.component.scss']
})
export class FilterCoursesComponent implements OnChanges {
  @Input() courses: Array<CourseForFilter>;
  @Output() filterChanged = new EventEmitter<string[]>();

  @ViewChildren('cmp') components: QueryList<any>;

  yearsWithCourses: {
    years: Array<{
      year: number,
      blocks: Array<{
        index: number,
        courses: Array<CourseForFilter>
      }>
    }>
  };


  ngOnChanges(changes: SimpleChanges) {
    if (this.courses && ((changes && changes.courses && changes.courses.firstChange) ||
      (changes && !!changes.courses && changes.courses.currentValue !== changes.courses.previousValue))) {
      const uniqueYears = this.courses
        .map(c => c.leerjaar)
        .filter((x, i, a) => x && a.indexOf(x) === i);
      // Make a hierarchy of jaren containing blokken containing cursussen
      this.yearsWithCourses = {
        years: uniqueYears.map(year => {
          const uniqueBlocks = this.courses
            .filter(c => c.leerjaar === year)
            .map(c => c.blok)
            .filter((x, i, a) => x && a.indexOf(x) === i);
          uniqueBlocks.sort();
          return ({
            year,
            blocks: uniqueBlocks.map(block => ({
              index: block,
              courses: this.courses ? this.courses
                .filter(cursus => cursus.blok && cursus.blok === block &&
                  cursus.leerjaar === year)
                .sort((a, b) =>
                  (a.sequenceNumber > b.sequenceNumber) ? 1 :
                    ((b.sequenceNumber > a.sequenceNumber) ? -1 : 0)) : []
            })),
          });
        })
      };
    }
  }

  trackByYear(index: number, item: { year: number, blocks: Array<{ courses: Array<CourseForFilter> }> }) {
    return item ? item.year : index;
  }

  trackByBlock(index: number, item: { index: number, courses: Array<CourseForFilter> }) {
    return item ? item.index : index;
  }
  trackByCourse(index: number, course: CourseForFilter) {
    return course ? course.code : index;
  }

  allSelected(year: number) {
    return !this.courses.find(c => c.leerjaar === year && !c.selected);
  }

  nothingSelected(year: number) {
    return !this.courses.find(c => c.leerjaar === year && c.selected);
  }

  selectCursus(course: CourseForFilter) {
    const selectedCourses = course.selected ?
      this.courses
        .filter(c => c.selected && c.code !== course.code)
        .map(c => c.code) :
      [...this.courses
        .filter(c => c.selected)
        .map(c => c.code), course.code];

    this.filterChanged.emit(selectedCourses);
  }

  selectYear(year: number, select: boolean) {
    const selectedCourses = this.courses
      .filter(c => select ?
        c.selected || c.leerjaar === year :
        c.selected && c.leerjaar !== year)
      .map(c => c.code);

    this.filterChanged.emit(selectedCourses);
  }

}
