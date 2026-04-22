/**
 * usuario-form-modal.component.spec.ts — Migrado de Jasmine para Vitest
 * HttpClientTestingModule → provideHttpClientTesting() (Angular 17+)
 * spyOn → vi.spyOn | jasmine.objectContaining → expect.objectContaining
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient }        from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { UsuarioFormModalComponent } from './usuario-form-modal.component';
import { UsuariosService, Usuario } from '../../../../../core/services/usuarios.service';
import { ConfirmDialogService }      from '../../../../../core/services/confirm-dialog.service';
import { ToastService }              from '../../../../../core/services/toast.service';
import { LiveAnnouncer }             from '@angular/cdk/a11y';

describe('UsuarioFormModalComponent', () => {
  let component: UsuarioFormModalComponent;
  let fixture: ComponentFixture<UsuarioFormModalComponent>;
  let httpTestingController: HttpTestingController;

  const mockUsuariosService = {
    verificarCpf: vi.fn(),
    atualizar:    vi.fn(),
  };
  const mockConfirmDialog = { confirmar: vi.fn() };
  const mockToastService  = { sucesso: vi.fn(), erro: vi.fn() };

  const mockUsuario: Usuario = {
    id: '123',
    nome: 'Carlos Silva',
    username: 'carlos',
    cpf: '11122233344',
    email: 'carlos@braille.com',
    role: 'SECRETARIA',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUsuariosService.atualizar.mockReturnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [UsuarioFormModalComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsuariosService,      useValue: mockUsuariosService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialog   },
        { provide: ToastService,         useValue: mockToastService    },
        LiveAnnouncer,
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(UsuarioFormModalComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('deve formatar valores na injeção de Input do modal', () => {
    component.usuarioEdicao = mockUsuario;
    expect(component.editForm.get('nome')?.value).toBe('Carlos Silva');
    expect(component.editForm.get('cpf')?.value).toBe('111.222.333-44');
    expect(component.editForm.get('role')?.value).toBe('SECRETARIA');
  });

  it('deve emitir evento ao tentar fechar modal com dados não salvos', fakeAsync(() => {
    component.usuarioEdicao = mockUsuario;
    component.editForm.get('nome')?.setValue('Carlos Editado');
    component.editForm.get('nome')?.markAsDirty();

    const emitSpy = vi.spyOn(component.tentarFecharSujo, 'emit');
    component.onCancelBtn();

    expect(emitSpy).toHaveBeenCalledWith(true);
  }));

  it('deve buscar CEP e preencher endereço', () => {
    component.editForm.get('cep')?.setValue('01001-000');
    component.buscarCep();

    const req = httpTestingController.expectOne('https://viacep.com.br/ws/01001000/json/');
    expect(req.request.method).toBe('GET');

    req.flush({ logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' });

    expect(component.editForm.get('rua')?.value).toBe('Praça da Sé');
    expect(component.editForm.get('cidade')?.value).toBe('São Paulo');
  });

  it('deve bloquear submissão quando CPF está em conflito', () => {
    component.usuarioEdicao = mockUsuario;
    component.cpfStatus.set('ativo');

    component.onSaveForm();
    expect(mockUsuariosService.atualizar).not.toHaveBeenCalled();
    expect(component.editForm.touched).toBe(true);
  });

  it('submissão válida deve notificar camada pai e emitir Toast', fakeAsync(() => {
    component.usuarioEdicao = mockUsuario;
    component.cpfStatus.set('livre');

    const salvarSpy  = vi.spyOn(component.salvar, 'emit');
    const fecharSpy  = vi.spyOn(component, 'fecharModal');

    component.onSaveForm();
    tick();

    expect(mockUsuariosService.atualizar).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({ nome: 'Carlos Silva' }),
    );
    expect(mockToastService.sucesso).toHaveBeenCalled();
    expect(salvarSpy).toHaveBeenCalled();
  }));
});
