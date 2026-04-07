import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi, describe, it, beforeEach, expect, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { NoticiasLista } from './noticias-lista';
import { ComunicadosService, Comunicado } from '../../../../core/services/comunicados.service';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const comunicadoFactory = (overrides: Partial<Comunicado> = {}): Comunicado => ({
  id:           'c1',
  titulo:       'Notícia Teste',
  conteudo:     '<p>Conteúdo</p>',
  categoria:    'NOTICIA',
  fixado:       false,
  imagemCapa:   undefined,
  criadoEm:     new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  ...overrides,
});

const mockResponse = (data: Comunicado[], extra = {}) => ({
  data,
  total:      data.length,
  totalPages: 1,
  ...extra,
});

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('NoticiasLista', () => {
  let component: NoticiasLista;
  let comunicadosServiceSpy: any;

  beforeEach(async () => {
    comunicadosServiceSpy = {
      listar: vi.fn().mockReturnValue(of(mockResponse([comunicadoFactory()]))),
    };

    await TestBed.configureTestingModule({
      imports: [NoticiasLista],
      providers: [
        { provide: ComunicadosService, useValue: comunicadosServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NoticiasLista);
    component     = fixture.componentInstance;
    fixture.detectChanges(); // chama ngOnInit
  });

  afterEach(() => TestBed.resetTestingModule());

  // ── Criação ──────────────────────────────────────────────────────────────────

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  // ── Estado inicial ───────────────────────────────────────────────────────────

  it('deve ter carregando=false após ngOnInit completar', () => {
    expect(component.carregando()).toBe(false);
  });

  it('deve carregar comunicados na inicialização', () => {
    expect(comunicadosServiceSpy.listar).toHaveBeenCalledTimes(1);
    expect(component.comunicados().length).toBe(1);
  });

  it('deve inicializar filtros com valores neutros', () => {
    expect(component.categoriaSelecionada()).toBeNull();
    expect(component.busca()).toBe('');
    expect(component.paginaAtual()).toBe(1);
  });

  // ── Filtro por categoria ─────────────────────────────────────────────────────

  it('deve atualizar categoriaSelecionada e recarregar ao filtrar', () => {
    component.filtrarPorCategoria('NOTICIA');
    expect(component.categoriaSelecionada()).toBe('NOTICIA');
    expect(comunicadosServiceSpy.listar).toHaveBeenCalledTimes(2); // ngOnInit + filtro
  });

  it('não deve recarregar se a mesma categoria for selecionada', () => {
    component.filtrarPorCategoria('NOTICIA');
    component.filtrarPorCategoria('NOTICIA'); // mesma — sem novo fetch
    expect(comunicadosServiceSpy.listar).toHaveBeenCalledTimes(2);
  });

  // ── Busca ────────────────────────────────────────────────────────────────────

  it('deve chamar carregarComunicados ao executar busca', () => {
    component.busca.set('braille');
    component.executarBuscar();
    expect(comunicadosServiceSpy.listar).toHaveBeenCalledTimes(2);
  });

  // ── Paginação ────────────────────────────────────────────────────────────────

  it('deve incrementar página e carregar mais itens', () => {
    // simula resposta com totalPages=2 para habilitar "tem mais"
    comunicadosServiceSpy.listar.mockReturnValueOnce(
      of(mockResponse([comunicadoFactory({ id: 'c2' })], { totalPages: 2 }))
    );
    component.carregarComunicados(true);
    expect(component.temMais()).toBe(true);

    component.carregarMais();
    expect(component.paginaAtual()).toBe(2);
    expect(comunicadosServiceSpy.listar).toHaveBeenCalledTimes(3);
  });

  it('não deve carregar mais se temMais=false', () => {
    const chamadas = comunicadosServiceSpy.listar.mock.calls.length;
    component.carregarMais(); // temMais() é false por padrão
    expect(comunicadosServiceSpy.listar.mock.calls.length).toBe(chamadas);
  });

  // ── Tratamento de erro ───────────────────────────────────────────────────────

  it('deve setar carregando=false mesmo em caso de erro de rede', async () => {
    comunicadosServiceSpy.listar.mockReturnValueOnce(throwError(() => new Error('Network')));
    component.carregarComunicados(true);
    expect(component.carregando()).toBe(false);
  });

  // ── Acumulação de dados (load more) ─────────────────────────────────────────

  it('deve acumular itens ao chamar carregarComunicados com reset=false', () => {
    //  Carregamento inicial já trouxe 1 item
    comunicadosServiceSpy.listar.mockReturnValueOnce(
      of(mockResponse([comunicadoFactory({ id: 'c2' })], { totalPages: 2 }))
    );
    component.temMais.set(true);
    component.paginaAtual.update(v => v + 1);
    component.carregarComunicados(false);

    // Deve ter 2 itens acumulados: c1 + c2
    expect(component.comunicados().length).toBe(2);
  });
});
