import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessorComponent } from './processor.component';

describe('ProcessorComponent', () => {
  let component: ProcessorComponent;
  let fixture: ComponentFixture<ProcessorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcessorComponent]
    });
    fixture = TestBed.createComponent(ProcessorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
