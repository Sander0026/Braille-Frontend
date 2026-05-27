import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { BeneficiariosService, LinhaTempoAlunoResponse } from '../../../../core/services/beneficiarios.service';
import { AlunoLinhaTempoComponent } from './aluno-linha-tempo';

describe('AlunoLinhaTempoComponent', () => {
  let fixture: ComponentFixture<AlunoLinhaTempoComponent>;
  let component: AlunoLinhaTempoComponent;
  let beneficiariosService: {
    linhaTempo: ReturnType<typeof vi.fn>;
    linhaTempoTurmas: ReturnType<typeof vi.fn>;
  };

  const respostaLinhaTempo: LinhaTempoAlunoResponse = {
    data: [
      {
        id: 'evento-1',
        alunoId: 'aluno-1',
        tipo: 'ATENDIMENTO_INDIVIDUAL',
        origem: 'ATENDIMENTO_INDIVIDUAL',
        data: '2026-05-20T10:00:00.000Z',
        titulo: 'Atendimento individual realizado',
        descricao: 'Aluno participou do atendimento.',
        turmaNome: 'Braille Nivel 1',
        professorNome: 'Professor PDF',
      },
    ],
    meta: { page: 1, limit: 20, total: 1, lastPage: 1 },
  };

  beforeEach(async () => {
    beneficiariosService = {
      linhaTempo: vi.fn(() => of(respostaLinhaTempo)),
      linhaTempoTurmas: vi.fn(() => of([{ id: 'turma-1', nome: 'Braille Nivel 1' }])),
    };

    await TestBed.configureTestingModule({
      imports: [AlunoLinhaTempoComponent],
      providers: [{ provide: BeneficiariosService, useValue: beneficiariosService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AlunoLinhaTempoComponent);
    component = fixture.componentInstance;
  });

  it('deve carregar e renderizar os eventos da linha do tempo do aluno', () => {
    component.alunoId = 'aluno-1';
    component.ngOnChanges({
      alunoId: new SimpleChange(undefined, 'aluno-1', true),
    });
    fixture.detectChanges();

    expect(beneficiariosService.linhaTempo).toHaveBeenCalledWith(
      'aluno-1',
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    expect(component.carregando).toBe(false);
    expect(component.eventos).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Atendimento individual realizado');
    expect(fixture.nativeElement.textContent).toContain('Braille Nivel 1');
  });

  it('deve buscar turmas quando estiver em modo completo', () => {
    component.alunoId = 'aluno-1';
    component.modo = 'completo';
    component.ngOnChanges({
      alunoId: new SimpleChange(undefined, 'aluno-1', true),
      modo: new SimpleChange('compacto', 'completo', true),
    });

    expect(beneficiariosService.linhaTempoTurmas).toHaveBeenCalledWith('aluno-1');
    expect(component.turmas).toEqual([{ id: 'turma-1', nome: 'Braille Nivel 1' }]);
    expect(component.carregandoTurmas).toBe(false);
  });

  it('deve desligar o carregamento ao receber erro da API', () => {
    beneficiariosService.linhaTempo.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Falha ao consultar linha do tempo.' } })),
    );

    component.alunoId = 'aluno-1';
    component.ngOnChanges({
      alunoId: new SimpleChange(undefined, 'aluno-1', true),
    });

    expect(component.carregando).toBe(false);
    expect(component.erro).toBe('Falha ao consultar linha do tempo.');
  });

  it('nao deve ficar carregando para sempre se a resposta vier sem meta', () => {
    beneficiariosService.linhaTempo.mockReturnValueOnce(of({ data: [] }));

    component.alunoId = 'aluno-1';
    component.ngOnChanges({
      alunoId: new SimpleChange(undefined, 'aluno-1', true),
    });

    expect(component.carregando).toBe(false);
    expect(component.eventos).toEqual([]);
    expect(component.lastPage).toBe(1);
  });

  it('deve manter o carregamento apenas enquanto a consulta estiver pendente', () => {
    const resposta$ = new Subject<LinhaTempoAlunoResponse>();
    beneficiariosService.linhaTempo.mockReturnValueOnce(resposta$.asObservable());

    component.alunoId = 'aluno-1';
    component.ngOnChanges({
      alunoId: new SimpleChange(undefined, 'aluno-1', true),
    });

    expect(component.carregando).toBe(true);

    resposta$.next(respostaLinhaTempo);
    resposta$.complete();

    expect(component.carregando).toBe(false);
    expect(component.eventos).toHaveLength(1);
  });
});
