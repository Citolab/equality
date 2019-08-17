import { Component, OnInit, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-textarea-form',
  templateUrl: './textarea-form.component.html',
  styleUrls: ['./textarea-form.component.css']
})
export class TextareaFormComponent implements OnChanges {
  @Input() debounceTime = 500;
  @Input() text: string;
  @Output() textChanged: EventEmitter<TextChangedEvent> = new EventEmitter();
  @Output() changed: EventEmitter<TextChangedEvent> = new EventEmitter();

  textForm: FormGroup;
  textControl: FormControl;

  constructor() {
    this.textControl = new FormControl();
    this.textForm = new FormGroup({
      textControl: this.textControl
    });
  }

  changes() {
    this.changed.emit({
      text: this.textControl.value
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.text) {
      this.textControl.setValue(changes.text.currentValue, { emitEvent: false });
    }
    this.textForm.valueChanges
      .pipe(debounceTime(this.debounceTime))
      .subscribe(_ => {
        this.textChanged.emit({
          text: this.textControl.value
        });
      });
  }
}




export class TextChangedEvent {
  text: string;
}
