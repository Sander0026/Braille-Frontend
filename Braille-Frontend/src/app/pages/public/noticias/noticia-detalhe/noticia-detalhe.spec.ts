import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { vi, describe, it, beforeEach, expect, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { ParamMap, convertToParamMap } from '@angular/router';

import { NoticiaDetalhe } from './noticia-detalhe';
import { ComunicadosService, Comunicado } from '../../../../core/services/comunicados.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const comunicadoStub: Comunicado = {
  id:           'abc-123',
  titulo:       'Notícia de Teste',
  conteudo:     '<p>Conteúdo da notícia.</p>',
  categoria:    'NOTICIA',
  fixado:       false,
  imagemCapa:   'https://res.cloudinary.com/test/image.jpg',
  criadoEm:     '2024-01-01T00:00:00Z',
  atualizadoEm: '2024-01-01T00:00:00Z',
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('NoticiaDetalhe', () => {
  let component:          NoticiaDetalhe;
  let comunicadosSpy:     any;
  let titleSpy:           any;
  let metaSpy:            any;
  let paramMapSubject$:   any;

  beforeEach(async () => {
    const { Subject } = await import('rxjs');
    paramMapSubject$ = new Subject<ParamMap>();

    comunicadosSpy = {
      buscarPorId: vi.fn().mockReturnValue(of(comunicadoStub)),
    };
    titleSpy = { setTitle: vi.fn() };
    metaSpy  = { updateTag: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [NoticiaDetalhe],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ComunicadosService, useValue: comunicadosSpy },
        { provide: Title,              useValue: titleSpy },
        { provide: Meta,               useValue: metaSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject$.asObservable() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NoticiaDetalhe);
    component     = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  // ── Criação ──────────────────────────────────────────────────────────────────

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar com carregando=true e sem notícia', () => {
    // Antes de emitir qualquer paramMap
    expect(component.carregando()).toBe(true);
    expect(component.noticia()).toBeNull();
  });

  // ── Carregamento de notícia ───────────────────────────────────────────────────

  it('deve carregar a notícia ao receber um id via paramMap', () => {
    paramMapSubject$.next(convertToParamMap({ id: 'abc-123' }));

    expect(comunicadosSpy.buscarPorId).toHaveBeenCalledWith('abc-123');
    expect(component.noticia()).toEqual(comunicadoStub);
    expect(component.carregando()).toBe(false);
    expect(component.erro()).toBeNull();
  });

  it('deve atualizar o título da página ao carregar a notícia', () => {
    paramMapSubject$.next(convertToParamMap({ id: 'abc-123' }));
    expect(titleSpy.setTitle).toHaveBeenCalledWith(
      `${comunicadoStub.titulo} — Instituto Luiz Braille`
    );
  });

  it('deve atualizar a meta description ao carregar a notícia', () => {
    paramMapSubject$.next(convertToParamMap({ id: 'abc-123' }));
    expect(metaSpy.updateTag).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'description' })
    );
  });

  it('deve atualizar og:image se a notícia tiver imagemCapa', () => {
    paramMapSubject$.next(convertToParamMap({ id: 'abc-123' }));
    expect(metaSpy.updateTag).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:image', content: comunicadoStub.imagemCapa })
    );
  });

  // ── Sem ID na rota ────────────────────────────────────────────────────────────

  it('deve setar erro se paramMap não tiver id', () => {
    paramMapSubject$.next(convertToParamMap({}));

    expect(component.erro()).toBe('Notícia não encontrada.');
    expect(component.carregando()).toBe(false);
    expect(comunicadosSpy.buscarPorId).not.toHaveBeenCalled();
  });

  // ── Erro de rede ─────────────────────────────────────────────────────────────

  it('deve setar mensagem de erro e carregando=false em caso de falha da API', () => {
    comunicadosSpy.buscarPorId.mockReturnValueOnce(throwError(() => new Error('Network')));
    paramMapSubject$.next(convertToParamMap({ id: 'erro-id' }));

    expect(component.erro()).toContain('Não foi possível carregar essa notícia');
    expect(component.carregando()).toBe(false);
    expect(component.noticia()).toBeNull();
  });

  it('deve atualizar título para "não encontrada" em caso de erro da API', () => {
    comunicadosSpy.buscarPorId.mockReturnValueOnce(throwError(() => new Error('404')));
    paramMapSubject$.next(convertToParamMap({ id: 'erro-id' }));

    expect(titleSpy.setTitle).toHaveBeenCalledWith(
      'Notícia não encontrada — Instituto Luiz Braille'
    );
  });
});
