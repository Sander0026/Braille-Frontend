/**
 * usuarios-lista.spec.ts — Migrado de Jasmine para Vitest (runner do projeto)
 * jasmine.SpyObj → vi.fn() | jasmine.createSpyObj → vi mock object | .and.returnValue → mockReturnValue
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UsuariosLista } from './usuarios-lista';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { of, throwError } from 'rxjs';

describe('UsuariosLista', () => {
  let component: UsuariosLista;
  let fixture: ComponentFixture<UsuariosLista>;

  const mockUsuariosService = {
    listar:            vi.fn(),
    excluir:           vi.fn(),
    excluirDefinitivo: vi.fn(),
    restaurar:         vi.fn(),
  };
  const mockConfirmDialog  = { confirmar: vi.fn() };
  const mockToastService   = { sucesso: vi.fn(), erro: vi.fn() };
  const mockLiveAnnouncer  = { announce: vi.fn() };

  const mockUsuario: Usuario = {
    id: 'u1',
    nome: 'Maria',
    username: 'maria123',
    email: 'maria@braille.com',
    role: 'ADMIN',
    statusAtivo: true,
  };

  const mockResponse = {
    data: [mockUsuario],
    meta: { total: 1, lastPage: 1 },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUsuariosService.listar.mockReturnValue(of(mockResponse as any));
    mockUsuariosService.excluir.mockReturnValue(of({}));
    mockUsuariosService.excluirDefinitivo.mockReturnValue(of({}));
    mockUsuariosService.restaurar.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [UsuariosLista],
      providers: [
        { provide: UsuariosService,       useValue: mockUsuariosService },
        { provide: ConfirmDialogService,  useValue: mockConfirmDialog   },
        { provide: ToastService,          useValue: mockToastService    },
        { provide: LiveAnnouncer,         useValue: mockLiveAnnouncer   },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(UsuariosLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve carregar usuários listando via API (OnInit)', () => {
    expect(component).toBeTruthy();
    expect(mockUsuariosService.listar).toHaveBeenCalledWith(1, 10, undefined, false);
    expect(component.usuarios()).toEqual([mockUsuario]);
    expect(component.isLoading()).toBe(false);
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
    mockUsuariosService.listar.mockReturnValue(throwError(() => new Error('API Timeout')));
    component.carregar();
    expect(component.isLoading()).toBe(false);
    expect(component.erro()).toBe('Erro ao carregar usuários.');
  });

  it('abertura e manipulação de perfil modal', () => {
    component.abrirPerfil(mockUsuario);
    expect(component.usuarioVisualizado()).toEqual(mockUsuario);

    component.fecharPerfil();
    expect(component.usuarioVisualizado()).toBeNull();
  });

  it('Safe Delete — inativar usuário ao confirmar prompt', fakeAsync(() => {
    mockConfirmDialog.confirmar.mockResolvedValue(true);
    component.excluir(mockUsuario);
    tick();

    expect(mockUsuariosService.excluir).toHaveBeenCalledWith(mockUsuario.id);
    expect(mockToastService.sucesso).toHaveBeenCalled();
  }));

  it('Safe Delete — cancelamento não exclui', fakeAsync(() => {
    mockConfirmDialog.confirmar.mockResolvedValue(false);
    component.excluir(mockUsuario);
    tick();

    expect(mockUsuariosService.excluir).not.toHaveBeenCalled();
  }));

  it('exclusão definitiva engatilha cascata no backend', fakeAsync(() => {
    mockConfirmDialog.confirmar.mockResolvedValue(true);
    component.excluirDefinitivamente(mockUsuario);
    tick();

    expect(mockUsuariosService.excluirDefinitivo).toHaveBeenCalledWith(mockUsuario.id);
    expect(mockToastService.sucesso).toHaveBeenCalled();
  }));

  it('restaurar conta notifica toast', fakeAsync(() => {
    mockConfirmDialog.confirmar.mockResolvedValue(true);
    component.restaurarConta(mockUsuario);
    tick();

    expect(mockUsuariosService.restaurar).toHaveBeenCalledWith(mockUsuario.id);
    expect(mockToastService.sucesso).toHaveBeenCalled();
  }));
});
