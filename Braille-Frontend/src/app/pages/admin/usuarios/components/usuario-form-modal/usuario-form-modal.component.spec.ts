import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UsuarioFormModalComponent } from './usuario-form-modal.component';
import { UsuariosService, Usuario } from '../../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('UsuarioFormModalComponent', () => {
  let component: UsuarioFormModalComponent;
  let fixture: ComponentFixture<UsuarioFormModalComponent>;
  let mockUsuariosService: jasmine.SpyObj<UsuariosService>;
  let mockConfirmDialog: jasmine.SpyObj<ConfirmDialogService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let httpTestingController: HttpTestingController;

  const mockUsuario: Usuario = {
    id: '123',
    nome: 'Carlos Silva',
    username: 'carlos',
    cpf: '11122233344',
    email: 'carlos@braille.com',
    role: 'SECRETARIA'
  };

  beforeEach(async () => {
    mockUsuariosService = jasmine.createSpyObj('UsuariosService', ['verificarCpf', 'atualizar']);
    mockConfirmDialog = jasmine.createSpyObj('ConfirmDialogService', ['confirmar']);
    mockToastService = jasmine.createSpyObj('ToastService', ['sucesso', 'erro']);

    mockUsuariosService.atualizar.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [UsuarioFormModalComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: UsuariosService, useValue: mockUsuariosService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialog },
        { provide: ToastService, useValue: mockToastService },
        LiveAnnouncer
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioFormModalComponent);
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

  it('valida emissão segura para fechamento "sujo" (Dirty Form) interceptada pelo Dialog', fakeAsync(() => {
    component.usuarioEdicao = mockUsuario; // reseta
    component.editForm.get('nome')?.setValue('Carlos Editado');
    component.editForm.get('nome')?.markAsDirty();

    spyOn(component.tentarFecharSujo, 'emit');
    component.onCancelBtn();

    expect(component.tentarFecharSujo.emit).toHaveBeenCalledWith(true);
  }));

  it('deve realizar busca cirurgica de CEP com Sanitização segura de Observables', () => {
    component.editForm.get('cep')?.setValue('01001-000');
    component.buscarCep();

    const req = httpTestingController.expectOne('https://viacep.com.br/ws/01001000/json/');
    expect(req.request.method).toBe('GET');
    
    // Simula sucesso da request OpenSource ViaCep
    req.flush({ logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' });

    expect(component.editForm.get('rua')?.value).toBe('Praça da Sé');
    expect(component.editForm.get('cidade')?.value).toBe('São Paulo');
  });

  it('garantir Atomicidade em chamadas Save (Bloquear Requests Incorretas/CPF em conflito)', () => {
    component.usuarioEdicao = mockUsuario;
    // Força um conflito no CPF
    component.cpfStatus.set('ativo');
    
    component.onSaveForm();
    expect(mockUsuariosService.atualizar).not.toHaveBeenCalled();
    expect(component.editForm.touched).toBeTrue();
  });

  it('Submissão validada deve notificar camada pai e emitir Toast limpo (Happy Path)', fakeAsync(() => {
    component.usuarioEdicao = mockUsuario;
    component.cpfStatus.set('livre');

    spyOn(component.salvar, 'emit');
    spyOn(component, 'fecharModal');
    
    component.onSaveForm();
    tick();

    expect(mockUsuariosService.atualizar).toHaveBeenCalledWith('123', jasmine.objectContaining({ nome: 'Carlos Silva' }));
    expect(mockToastService.sucesso).toHaveBeenCalled();
    expect(component.salvar.emit).toHaveBeenCalled();
  }));
});
