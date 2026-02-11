import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryList } from './beneficiary-list';

describe('BeneficiaryList', () => {
  let component: BeneficiaryList;
  let fixture: ComponentFixture<BeneficiaryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
