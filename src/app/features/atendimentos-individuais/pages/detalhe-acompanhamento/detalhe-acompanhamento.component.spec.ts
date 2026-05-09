import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { DetalheAcompanhamentoComponent } from './detalhe-acompanhamento.component';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';

function makeAcompanhamento(overrides: Partial<AcompanhamentoIndividual> = {}): AcompanhamentoIndividual {
  return {
    id: 'acomp-1',
    alunoId: 'aluno-1',
    professorId: 'prof-1',
    assuntoAtual: 'Braille basico',
    status: 'EM_ANDAMENTO',
    dataInicio: '2026-01-15',
    criadoEm: '2026-01-15',
    atualizadoEm: '2026-05-01',
    aluno: { id: 'aluno-1', nomeCompleto: 'Aluno Teste', matricula: '202600001' },
    professor: { id: 'prof-1', nome: 'Professor Teste' },
    atendimentos: [],
    _count: { atendimentos: 0 },
    ...overrides,
  };
}

describe('DetalheAcompanhamentoComponent', () => {
  let component: DetalheAcompanhamentoComponent;
  let fixture: ComponentFixture<DetalheAcompanhamentoComponent>;
  let mockAuthService: { getUser: ReturnType<typeof vi.fn> };
  let mockApiService: Record<string, ReturnType<typeof vi.fn>>;

  function setup(userRole: string, acompanhamento: AcompanhamentoIndividual) {
    mockAuthService = {
      getUser: vi.fn().mockReturnValue({ sub: 'user-1', nome: 'Teste', role: userRole }),
    };

    mockApiService = {
      buscar: vi.fn().mockReturnValue(of(acompanhamento)),
      arquivar: vi.fn().mockReturnValue(of(acompanhamento)),
      desarquivar: vi.fn().mockReturnValue(of(acompanhamento)),
      finalizar: vi.fn().mockReturnValue(of(acompanhamento)),
      atualizarAssunto: vi.fn().mockReturnValue(of(acompanhamento)),
      reabrir: vi.fn().mockReturnValue(of(acompanhamento)),
    };

    TestBed.configureTestingModule({
      imports: [DetalheAcompanhamentoComponent, HttpClientTestingModule],
      providers: [
        { provide: AtendimentosIndividuaisApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: { sucesso: vi.fn(), erro: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'acomp-1' } } } },
      ],
    });

    fixture = TestBed.createComponent(DetalheAcompanhamentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ─── 1. ADMIN vê Arquivar e Desarquivar ────────────────────────────

  it('ADMIN deve ver botao Arquivar quando status nao e ARQUIVADO', () => {
    setup('ADMIN', makeAcompanhamento({ status: 'EM_ANDAMENTO' }));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const arquivarBtn = buttons.find((b) => b.textContent?.trim() === 'Arquivar');
    expect(arquivarBtn).toBeTruthy();
  });

  it('ADMIN deve ver botao Desarquivar quando status e ARQUIVADO', () => {
    setup('ADMIN', makeAcompanhamento({ status: 'ARQUIVADO' }));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const desarquivarBtn = buttons.find((b) => b.textContent?.trim() === 'Desarquivar');
    expect(desarquivarBtn).toBeTruthy();
  });

  // ─── 2. SECRETARIA não vê Arquivar/Desarquivar ─────────────────────

  it('SECRETARIA nao deve ver botoes Arquivar ou Desarquivar', () => {
    setup('SECRETARIA', makeAcompanhamento({ status: 'EM_ANDAMENTO' }));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const arquivarBtn = buttons.find((b) => b.textContent?.includes('Arquivar'));
    const desarquivarBtn = buttons.find((b) => b.textContent?.includes('Desarquivar'));

    expect(arquivarBtn).toBeFalsy();
    expect(desarquivarBtn).toBeFalsy();
  });

  // ─── 3. PROFESSOR não vê Arquivar/Desarquivar ──────────────────────

  it('PROFESSOR nao deve ver botoes Arquivar ou Desarquivar', () => {
    setup('PROFESSOR', makeAcompanhamento({ status: 'EM_ANDAMENTO' }));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const arquivarBtn = buttons.find((b) => b.textContent?.includes('Arquivar'));

    expect(arquivarBtn).toBeFalsy();
  });

  // ─── 4. Confirmação de arquivamento aparece ────────────────────────

  it('deve exibir dialogo de confirmacao ao clicar em Arquivar', () => {
    setup('ADMIN', makeAcompanhamento({ status: 'EM_ANDAMENTO' }));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const arquivarBtn = buttons.find((b) => b.textContent?.trim() === 'Arquivar');
    arquivarBtn?.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Arquivar acompanhamento');
  });

  // ─── 5. Confirmação de desarquivamento aparece ─────────────────────

  it('deve exibir dialogo de confirmacao ao clicar em Desarquivar', () => {
    setup('ADMIN', makeAcompanhamento({ status: 'ARQUIVADO' }));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const desarquivarBtn = buttons.find((b) => b.textContent?.trim() === 'Desarquivar');
    desarquivarBtn?.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Desarquivar acompanhamento');
  });
});
