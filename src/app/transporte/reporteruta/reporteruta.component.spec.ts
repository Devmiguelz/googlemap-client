import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporterutaComponent } from './reporteruta.component';

describe('ReporterutaComponent', () => {
  let component: ReporterutaComponent;
  let fixture: ComponentFixture<ReporterutaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReporterutaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReporterutaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
