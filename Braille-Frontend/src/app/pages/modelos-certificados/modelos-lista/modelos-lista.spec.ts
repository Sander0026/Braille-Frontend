import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelosLista } from './modelos-lista';

describe('ModelosLista', () => {
  let component: ModelosLista;
  let fixture: ComponentFixture<ModelosLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelosLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelosLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
