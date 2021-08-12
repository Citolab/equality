import { Component, Input } from '@angular/core';

@Component({
  selector: 'equality-course-link',
  template: `
  <a class="text-dark d-flex justify-content-between p-0"
   [routerLink]="!readOnly ? ['/course', courseRoute] : null"
   [class.cursor-default]="readOnly"
   [class.text-underline]="!readOnly"
   [class.text-decoration-none]="readOnly">
  {{ courseName }}
  <span class="mdi mdi-open-in-new" [class.invisible]="readOnly"></span>
</a>
`,
  styles: [``]
})
export class CourseLinkComponent {
  @Input() courseName: string;
  @Input() courseRoute: string;
  @Input() readOnly: boolean;
}
