import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroWizard } from './cadastro-wizard';

describe('CadastroWizard', () => {
  let component: CadastroWizard;
  let fixture: ComponentFixture<CadastroWizard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroWizard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroWizard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
