import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelosLista } from './modelos-lista';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ModelosCertificadosService } from '../../../core/services/modelos-certificados.service';
import { of } from 'rxjs';

describe('ModelosLista', () => {
  let component: ModelosLista;
  let fixture: ComponentFixture<ModelosLista>;

  beforeEach(async () => {
    // Mock HTMLDialogElement for JSDOM
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function() {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function() {
        this.removeAttribute('open');
      };
    }

    await TestBed.configureTestingModule({
      imports: [ModelosLista],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastService, useValue: { sucesso: vi.fn(), erro: vi.fn(), aviso: vi.fn() } },
        { provide: ConfirmDialogService, useValue: { confirmar: vi.fn() } },
        { 
          provide: ModelosCertificadosService, 
          useValue: { listar: vi.fn().mockReturnValue(of([])) } 
        }
      ]
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
