import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UsuariosLista } from './usuarios-lista';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('UsuariosLista', () => {
  let component: UsuariosLista;
  let fixture: ComponentFixture<UsuariosLista>;
  
  let mockUsuariosService: jasmine.SpyObj<UsuariosService>;
  let mockConfirmDialog: jasmine.SpyObj<ConfirmDialogService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockLiveAnnouncer: jasmine.SpyObj<LiveAnnouncer>;

  const mockUsuario: Usuario = {
    id: 'u1',
    nome: 'Maria',
    username: 'maria123',
    email: 'maria@braille.com',
    role: 'ADMIN',
    statusAtivo: true
  };

  const mockResponse = {
    data: [mockUsuario],
    meta: { total: 1, lastPage: 1 }
  };

  beforeEach(async () => {
    mockUsuariosService = jasmine.createSpyObj('UsuariosService', ['listar', 'excluir', 'excluirDefinitivo', 'restaurar']);
    mockConfirmDialog = jasmine.createSpyObj('ConfirmDialogService', ['confirmar']);
    mockToastService = jasmine.createSpyObj('ToastService', ['sucesso', 'erro']);
    mockLiveAnnouncer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);

    mockUsuariosService.listar.and.returnValue(of(mockResponse as any));
    mockUsuariosService.excluir.and.returnValue(of({}));
    mockUsuariosService.excluirDefinitivo.and.returnValue(of({}));
    mockUsuariosService.restaurar.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [UsuariosLista],
      providers: [
        { provide: UsuariosService, useValue: mockUsuariosService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialog },
        { provide: ToastService, useValue: mockToastService },
        { provide: LiveAnnouncer, useValue: mockLiveAnnouncer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve carregar usuários listando via API (OnInit)', () => {
    expect(component).toBeTruthy();
    expect(mockUsuariosService.listar).toHaveBeenCalledWith(1, 10, undefined, false);
    expect(component.usuarios()).toEqual([mockUsuario]);
    expect(component.isLoading()).toBeFalse();
  });

  it('deve formatar label de cargos corretamente', () => {
    expect(component.labelRole('ADMIN')).toBe('Administrador');
    expect(component.labelRole('SECRETARIA')).toBe('Secretaria');
    expect(component.labelRole('UNKNOWN')).toBe('UNKNOWN');
  });

  it('deve alternar a aba de ativos para inativos e recarregar a lista', () => {
    component.setAba('inativos');
    expect(component.abaAtiva()).toBe('inativos');
    expect(mockUsuariosService.listar).toHaveBeenCalledWith(1, 10, undefined, true);
  });

  it('falha graciosa da API exibe mensagem de erro e inibe o loading state', () => {
    mockUsuariosService.listar.and.returnValue(throwError(() => new Error('API Timeout')));
    component.carregar();
    expect(component.isLoading()).toBeFalse();
    expect(component.erro()).toBe('Erro ao carregar usuários.');
  });

  it('abertura e manipulação de perfil modal', () => {
    component.abrirPerfil(mockUsuario);
    expect(component.usuarioVisualizado()).toEqual(mockUsuario);

    component.fecharPerfil();
    expect(component.usuarioVisualizado()).toBeNull();
  });

  it('teste seguro de exclusão (Safe Delete) - Inativar usuário ao confirmar prompt', fakeAsync(() => {
    mockConfirmDialog.confirmar.and.resolveTo(true);
    component.excluir(mockUsuario);
    tick(); // Wait for prompt resolution
    
    expect(mockUsuariosService.excluir).toHaveBeenCalledWith(mockUsuario.id);
    expect(mockToastService.sucesso).toHaveBeenCalled();
  }));

  it('teste seguro de exclusão (Safe Delete) - Cancelamento', fakeAsync(() => {
    mockConfirmDialog.confirmar.and.resolveTo(false);
    component.excluir(mockUsuario);
    tick();
    
    expect(mockUsuariosService.excluir).not.toHaveBeenCalled();
  }));

  it('exclusão definitiva engatilha cascata no backend', fakeAsync(() => {
    mockConfirmDialog.confirmar.and.resolveTo(true);
    component.excluirDefinitivamente(mockUsuario);
    tick();

    expect(mockUsuariosService.excluirDefinitivo).toHaveBeenCalledWith(mockUsuario.id);
    expect(mockToastService.sucesso).toHaveBeenCalled();
  }));

  it('restaurar dados do usuário e notificar toast', fakeAsync(() => {
    mockConfirmDialog.confirmar.and.resolveTo(true);
    component.restaurarConta(mockUsuario);
    tick();

    expect(mockUsuariosService.restaurar).toHaveBeenCalledWith(mockUsuario.id);
    expect(mockToastService.sucesso).toHaveBeenCalled();
  }));
});
