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
  let mockContatosService: jasmine.SpyObj<ContatosService>;
  let mockConfirmDialog: jasmine.SpyObj<ConfirmDialogService>;
  let mockLiveAnnouncer: jasmine.SpyObj<LiveAnnouncer>;

  const mockContato: Contato = {
    id: '1',
    nome: 'João',
    email: 'joao@example.com',
    mensagem: 'Olá, mundo!',
    lida: false,
    criadoEm: new Date().toISOString()
  };

  const mockPaginatedResponse = {
    data: [mockContato],
    meta: { total: 1, lastPage: 1 }
  };

  beforeEach(async () => {
    mockContatosService = jasmine.createSpyObj('ContatosService', ['listar', 'marcarComoLida', 'excluir']);
    mockConfirmDialog = jasmine.createSpyObj('ConfirmDialogService', ['confirmar']);
    mockLiveAnnouncer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);

    mockContatosService.listar.and.returnValue(of(mockPaginatedResponse as any));
    mockContatosService.marcarComoLida.and.returnValue(of({}));
    mockContatosService.excluir.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ContatosLista],
      providers: [
        { provide: ContatosService, useValue: mockContatosService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialog },
        { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
        DatePipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContatosLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(mockContatosService.listar).toHaveBeenCalledWith(1, 15, undefined);
    expect(component.contatos()).toEqual([mockContato]);
    expect(component.total()).toBe(1);
    expect(component.isLoading()).toBeFalse();
  });

  it('should filter contacts', () => {
    component.mudarFiltro('nao-lidas');
    expect(component.filtroAtivo()).toBe('nao-lidas');
    expect(mockContatosService.listar).toHaveBeenCalledWith(1, 15, false);

    component.mudarFiltro('lidas');
    expect(mockContatosService.listar).toHaveBeenCalledWith(1, 15, true);
  });

  it('should open message and mark as read', () => {
    component.abrirMensagem(mockContato);

    expect(component.contatoSelecionado()).toEqual(mockContato);
    expect(mockContatosService.marcarComoLida).toHaveBeenCalledWith(mockContato.id);
  });

  it('should handle API errors during load', () => {
    mockContatosService.listar.and.returnValue(throwError(() => new Error('Error')));
    
    component.carregar();
    expect(component.erro()).toBe('Erro ao carregar mensagens.');
    expect(component.isLoading()).toBeFalse();
  });

  it('should execute delete if confirmed', fakeAsync(() => {
    mockConfirmDialog.confirmar.and.resolveTo(true);
    
    component.excluir(mockContato);
    tick();

    expect(mockContatosService.excluir).toHaveBeenCalledWith(mockContato.id);
    expect(component.contatoSelecionado()).toBeNull();
  }));

  it('should not delete if not confirmed', fakeAsync(() => {
    mockConfirmDialog.confirmar.and.resolveTo(false);
    
    component.excluir(mockContato);
    tick();

    expect(mockContatosService.excluir).not.toHaveBeenCalled();
  }));

  it('should respect pagination limits', () => {
    component.totalPaginas.set(5);
    
    component.irParaPagina(3);
    expect(component.paginaAtual()).toBe(3);

    // Invalid bounds
    component.irParaPagina(10);
    expect(component.paginaAtual()).toBe(3); // stays at 3

    component.irParaPagina(0);
    expect(component.paginaAtual()).toBe(3); // stays at 3
  });
});
