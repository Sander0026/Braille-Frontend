import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { RelatorioAtendimentoComponent } from './relatorio-atendimento.component';
import { RelatorioAtendimentoApiService } from '../../services/relatorio-atendimento-api.service';
import { BeneficiariosService } from '../../../../core/services/beneficiarios.service';
import { UsuariosService } from '../../../../core/services/usuarios.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('RelatorioAtendimentoComponent', () => {
  let fixture: ComponentFixture<RelatorioAtendimentoComponent>;
  let api: { gerar: ReturnType<typeof vi.fn>; exportarPdf: ReturnType<typeof vi.fn> };

  function setup() {
    api = {
      gerar: vi.fn(),
      exportarPdf: vi.fn().mockReturnValue(of(new Blob(['pdf'], { type: 'application/pdf' }))),
    };

    TestBed.configureTestingModule({
      imports: [RelatorioAtendimentoComponent],
      providers: [
        { provide: RelatorioAtendimentoApiService, useValue: api },
        { provide: BeneficiariosService, useValue: { buscarResumo: vi.fn().mockReturnValue(of([])) } },
        { provide: UsuariosService, useValue: { listarResumo: vi.fn().mockReturnValue(of({ data: [] })) } },
        { provide: AuthService, useValue: { getUser: vi.fn().mockReturnValue({ sub: 'admin-1', role: 'ADMIN' }) } },
        { provide: ToastService, useValue: { erro: vi.fn(), sucesso: vi.fn() } },
      ],
    });

    fixture = TestBed.createComponent(RelatorioAtendimentoComponent);
    fixture.detectChanges();
  }

  it('deve exportar PDF usando os filtros atuais', () => {
    setup();
    const component = fixture.componentInstance;
    component.filtros = {
      alunoId: 'aluno-1',
      professorId: 'prof-1',
      dataInicio: '2026-05-01',
      dataFim: '2026-05-31',
      status: 'EM_ANDAMENTO',
      tipoRegistro: 'ATENDIMENTO_REALIZADO',
    };

    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:relatorio');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    component.exportarPdf();

    expect(api.exportarPdf).toHaveBeenCalledWith({
      alunoId: 'aluno-1',
      professorId: 'prof-1',
      dataInicio: '2026-05-01',
      dataFim: '2026-05-31',
      status: 'EM_ANDAMENTO',
      tipoRegistro: 'ATENDIMENTO_REALIZADO',
    });
    expect(mockLink.click).toHaveBeenCalled();
    expect(component.exportandoPdf).toBe(false);
  });
});
