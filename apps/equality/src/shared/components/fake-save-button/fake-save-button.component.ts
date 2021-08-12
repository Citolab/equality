import { Component, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'equality-fake-save-button',
  templateUrl: './fake-save-button.component.html',
  styleUrls: ['./fake-save-button.component.css']
})
export class FakeSaveButtonComponent {
  isFakeSaving = false;
  constructor(private ref: ChangeDetectorRef) { }

  setFakeSaving() {
    this.isFakeSaving = true;
    setTimeout(() => {
      this.isFakeSaving = false;
      this.ref.markForCheck();
    }, 1500);
  }
}
