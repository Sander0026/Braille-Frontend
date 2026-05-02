import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelosForm } from './modelos-form';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

describe('ModelosForm', () => {
  let component: ModelosForm;
  let fixture: ComponentFixture<ModelosForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelosForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastService, useValue: { sucesso: vi.fn(), erro: vi.fn(), aviso: vi.fn() } },
        { provide: LiveAnnouncer, useValue: { announce: vi.fn() } }
      ]
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
