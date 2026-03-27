import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelosForm } from './modelos-form';

describe('ModelosForm', () => {
  let component: ModelosForm;
  let fixture: ComponentFixture<ModelosForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelosForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelosForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
