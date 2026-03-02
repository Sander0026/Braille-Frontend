import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryDetails } from './beneficiary-details';

describe('BeneficiaryDetails', () => {
  let component: BeneficiaryDetails;
  let fixture: ComponentFixture<BeneficiaryDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
