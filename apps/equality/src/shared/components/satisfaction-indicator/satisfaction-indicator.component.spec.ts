/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SatisfactionIndicatorComponent } from './satisfaction-indicator.component';

describe('SatisfactionIndicatorComponent', () => {
  let component: SatisfactionIndicatorComponent;
  let fixture: ComponentFixture<SatisfactionIndicatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SatisfactionIndicatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SatisfactionIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
