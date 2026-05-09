import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { TimelineAtendimentosComponent } from './timeline-atendimentos.component';
import { ArquivosAtendimentoApiService } from '../../services/arquivos-atendimento-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { AtendimentoIndividual } from '../../models/atendimento-individual.model';

function makeAtendimentos(): AtendimentoIndividual[] {
  return [
    {
      id: 'atend-1',
      acompanhamentoId: 'acomp-1',
      alunoId: 'aluno-1',
      professorId: 'prof-1',
      dataAtendimento: '2026-05-08',
      horaInicio: '08:00',
      horaFim: '09:30',
      duracaoMinutos: 90,
      modalidade: 'PRESENCIAL',
      localAtendimento: 'Sala 3',
      tipoRegistro: 'ATENDIMENTO_REALIZADO',
      assuntoDoDia: 'Leitura avancada',
      observacao: 'Aluno progrediu bem.',
      arquivos: [
        {
          id: 'arq-1',
          atendimentoId: 'atend-1',
          nomeOriginal: 'laudo-medico.pdf',
          nomeArquivo: 'laudo-medico.pdf',
          downloadUrl: '/api/atendimentos-individuais/arquivos/arq-1/download',
          tipoArquivo: 'application/pdf',
          tamanho: 1024,
          categoria: 'LAUDO',
          criadoEm: '2026-05-08',
        },
      ],
    },
  ];
}

describe('TimelineAtendimentosComponent', () => {
  let mockArquivosApi: { download: ReturnType<typeof vi.fn> };

  // ─── 1. Timeline baixa anexo via service ───────────────────────────

  it('deve chamar ArquivosAtendimentoApiService.download ao clicar no arquivo', async () => {
    mockArquivosApi = {
      download: vi.fn().mockReturnValue(of(new Blob(['pdf-content'], { type: 'application/pdf' }))),
    };

    await TestBed.configureTestingModule({
      imports: [TimelineAtendimentosComponent, HttpClientTestingModule],
      providers: [
        { provide: ArquivosAtendimentoApiService, useValue: mockArquivosApi },
        { provide: ToastService, useValue: { sucesso: vi.fn(), erro: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TimelineAtendimentosComponent);
    const component = fixture.componentInstance;
    component.atendimentos = makeAtendimentos();
    fixture.detectChanges();

    // Mocka createElement e click para evitar erros no jsdom
    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const arquivo = makeAtendimentos()[0].arquivos![0];
    component.abrirArquivo(arquivo);

    expect(mockArquivosApi.download).toHaveBeenCalledWith('arq-1');
    expect(mockLink.click).toHaveBeenCalled();
  });

  // ─── 2. Relatório exibe detalhes do atendimento ────────────────────

  it('deve formatar detalhes com horario, modalidade e local', () => {
    // Usa runInInjectionContext para satisfazer inject() sem criar fixture
    TestBed.configureTestingModule({
      providers: [
        { provide: ArquivosAtendimentoApiService, useValue: { download: vi.fn() } },
        { provide: ToastService, useValue: { erro: vi.fn() } },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new TimelineAtendimentosComponent());
    const atendimento = makeAtendimentos()[0];
    const detalhes = component.detalhesAtendimento(atendimento);

    expect(detalhes).toContain('Inicio 08:00');
    expect(detalhes).toContain('Fim 09:30');
    expect(detalhes).toContain('90 min');
    expect(detalhes).toContain('Presencial');
    expect(detalhes).toContain('Local Sala 3');
  });
});
