import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryForm } from './beneficiary-form';

describe('BeneficiaryForm', () => {
  let component: BeneficiaryForm;
  let fixture: ComponentFixture<BeneficiaryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
