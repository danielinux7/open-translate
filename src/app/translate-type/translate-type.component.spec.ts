import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateTypeComponent } from './translate-type.component';

describe('TranslateTypeComponent', () => {
  let component: TranslateTypeComponent;
  let fixture: ComponentFixture<TranslateTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TranslateTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslateTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
