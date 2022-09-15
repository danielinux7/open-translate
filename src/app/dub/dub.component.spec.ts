import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DubComponent } from './dub.component';

describe('DubComponent', () => {
  let component: DubComponent;
  let fixture: ComponentFixture<DubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DubComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
