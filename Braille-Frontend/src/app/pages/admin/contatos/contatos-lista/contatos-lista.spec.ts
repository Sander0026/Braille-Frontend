/**
 * contatos-lista.spec.ts — Migrado de Jasmine para Vitest (runner do projeto)
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ContatosLista } from './contatos-lista';
import { ContatosService, Contato } from '../../../../core/services/contatos.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';

describe('ContatosLista', () => {
  let component: ContatosLista;
  let fixture: ComponentFixture<ContatosLista>;

  const mockContatosService = {
    listar:          vi.fn(),
    marcarComoLida:  vi.fn(),
    excluir:         vi.fn(),
  };
  const mockConfirmDialog = { confirmar: vi.fn() };
  const mockLiveAnnouncer = { announce: vi.fn() };

  const mockContato: Contato = {
    id: '1',
    nome: 'João',
    email: 'joao@example.com',
    mensagem: 'Olá, mundo!',
    lida: false,
    criadoEm: new Date().toISOString(),
  };

  const mockPaginatedResponse = {
    data: [mockContato],
    meta: { total: 1, lastPage: 1 },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockContatosService.listar.mockReturnValue(of(mockPaginatedResponse as any));
    mockContatosService.marcarComoLida.mockReturnValue(of({}));
    mockContatosService.excluir.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ContatosLista],
      providers: [
        { provide: ContatosService,      useValue: mockContatosService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialog   },
        { provide: LiveAnnouncer,        useValue: mockLiveAnnouncer   },
        DatePipe,
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ContatosLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente e carregar dados no init', () => {
    expect(component).toBeTruthy();
    expect(mockContatosService.listar).toHaveBeenCalledWith(1, 15, undefined);
    expect(component.contatos()).toEqual([mockContato]);
    expect(component.total()).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('deve filtrar contatos por status de leitura', () => {
    component.mudarFiltro('nao-lidas');
    expect(component.filtroAtivo()).toBe('nao-lidas');
    expect(mockContatosService.listar).toHaveBeenCalledWith(1, 15, false);

    component.mudarFiltro('lidas');
    expect(mockContatosService.listar).toHaveBeenCalledWith(1, 15, true);
  });

  it('deve abrir mensagem e marcar como lida', () => {
    component.abrirMensagem(mockContato);
    expect(component.contatoSelecionado()).toEqual(mockContato);
    expect(mockContatosService.marcarComoLida).toHaveBeenCalledWith(mockContato.id);
  });

  it('deve tratar erro de API graciosamente', () => {
    mockContatosService.listar.mockReturnValue(throwError(() => new Error('Error')));
    component.carregar();
    expect(component.erro()).toBe('Erro ao carregar mensagens.');
    expect(component.isLoading()).toBe(false);
  });

  it('deve excluir ao confirmar', fakeAsync(() => {
    mockConfirmDialog.confirmar.mockResolvedValue(true);
    component.excluir(mockContato);
    tick();
    expect(mockContatosService.excluir).toHaveBeenCalledWith(mockContato.id);
    expect(component.contatoSelecionado()).toBeNull();
  }));

  it('não deve excluir ao cancelar', fakeAsync(() => {
    mockConfirmDialog.confirmar.mockResolvedValue(false);
    component.excluir(mockContato);
    tick();
    expect(mockContatosService.excluir).not.toHaveBeenCalled();
  }));

  it('deve respeitar limites de paginação', () => {
    component.totalPaginas.set(5);

    component.irParaPagina(3);
    expect(component.paginaAtual()).toBe(3);

    component.irParaPagina(10);
    expect(component.paginaAtual()).toBe(3); // permanece em 3

    component.irParaPagina(0);
    expect(component.paginaAtual()).toBe(3); // permanece em 3
  });
});
