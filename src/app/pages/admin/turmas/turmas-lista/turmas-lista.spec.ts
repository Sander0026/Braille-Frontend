import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { TurmasLista } from './turmas-lista';
import { TurmasService } from '../../../../core/services/turmas.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

describe('TurmasLista Component', () => {
  let component: TurmasLista;
  let fixture: ComponentFixture<TurmasLista>;

  let mockTurmasService: any;
  let mockConfirmDialog: any;
  let mockToast: any;
  let mockAuthService: any;

  beforeEach(async () => {
    // Inicialização dos mocks usando o padrão Vitest para alta cobertura
    mockTurmasService = {
      listar: vi.fn(),
      listarProfessoresAtivos: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      mudarStatus: vi.fn(),
      excluir: vi.fn(),
      restaurar: vi.fn()
    };

    mockConfirmDialog = {
      confirmar: vi.fn()
    };

    mockToast = {
      sucesso: vi.fn(),
      erro: vi.fn()
    };

    mockAuthService = {
      getUser: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TurmasLista],
      providers: [
        { provide: TurmasService, useValue: mockTurmasService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialog },
        { provide: ToastService, useValue: mockToast },
        { provide: AuthService, useValue: mockAuthService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(TurmasLista, {
      remove: { imports: [] }, 
      add: { imports: [] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TurmasLista);
    component = fixture.componentInstance;

    // Configurando respostas padrão para as inicializações do RxJS
    mockAuthService.getUser.mockReturnValue({ role: 'ADMIN' });
    mockTurmasService.listarProfessoresAtivos.mockReturnValue(of([{ id: '1', nome: 'Prof 1', role: 'PROFESSOR' }]));
    mockTurmasService.listar.mockReturnValue(of({ 
      data: [
        { id: '100', nome: 'Oficina Ativa', excluido: false, statusAtivo: true, status: 'ANDAMENTO', professor: { id: '1', nome: 'Prof 1' } },
        { id: '101', nome: 'Oficina Inativa', excluido: false, statusAtivo: false, status: 'CONCLUIDA', professor: { id: '2', nome: 'Prof 2' } }
      ] 
    }));
  });

  describe('Diagnóstico de Inicialização & Separação de Rotas (Front/Back)', () => {
    it('deve instanciar o componente e configurar o perfil do usuário e carregar turmas na inicialização', () => {
      fixture.detectChanges(); // Trigger ngOnInit

      expect(component).toBeTruthy();
      expect(mockAuthService.getUser).toHaveBeenCalled();
      expect(component.isProfessor()).toBe(false);

      expect(mockTurmasService.listarProfessoresAtivos).toHaveBeenCalled();
      expect(component.professoresDisponiveis().length).toBe(1);

      expect(mockTurmasService.listar).toHaveBeenCalled();
      expect(component.turmas().length).toBe(2);
      expect(component.statusCount()['arquivadas']).toBe(1);
    });

    it('deve exibir apenas turmas ativas na computed turmasFiltradas por padrão', () => {
      fixture.detectChanges();
      const filtradas = component.turmasFiltradas();
      expect(filtradas.length).toBe(1);
      expect(filtradas[0].id).toBe('100');
    });

    it('nao deve carregar base de professores quando o usuario logado for PROFESSOR', () => {
      mockAuthService.getUser.mockReturnValue({ sub: 'prof-1', role: 'PROFESSOR' });

      fixture.detectChanges();

      expect(component.isProfessor()).toBe(true);
      expect(mockTurmasService.listarProfessoresAtivos).not.toHaveBeenCalled();
      expect(component.professoresDisponiveis()).toEqual([]);
      expect(mockTurmasService.listar).toHaveBeenCalledWith(1, 100, undefined, 'all', 'prof-1', undefined, 'all');
      expect(mockToast.erro).not.toHaveBeenCalledWith('Não foi possível carregar a base de professores.');
    });
  });

  describe('UI/UX: Controle do Drawer e Mutações de Estado do Filtro', () => {
    it('deve abrir o drawer de filtro ao chamar o método e refletir no estado local', () => {
      fixture.detectChanges();
      component.abrirFiltros();
      expect(component.drawerAberto()).toBe(true);
    });

    it('deve compor filtros avançados sem mutar a fonte de dados global, re-requisitando via Service e fechar drawer', () => {
      fixture.detectChanges();
      
      component.aplicarFiltros({ professorId: '1', status: 'ANDAMENTO' });
      
      expect(component.tempProfessorId()).toBe('1');
      expect(component.tempStatus()).toBe('ANDAMENTO');
      expect(component.drawerAberto()).toBe(false);

      // Garante a Atuação Segura nas requisições ao Back-end (Sem N+1, apenas nova requisição parametrizada)
      expect(mockTurmasService.listar).toHaveBeenCalledWith(1, 100, undefined, 'all', '1', 'ANDAMENTO', 'all');
    });

    it('deve limpar filtros visuais e restabelecer lista original', () => {
      fixture.detectChanges();
      component.tempProfessorId.set('1');
      
      component.limparFiltrosDrawer();
      expect(component.tempProfessorId()).toBe('');
      expect(component.tempStatus()).toBe('');
      expect(mockTurmasService.listar).toHaveBeenCalledWith(1, 100, undefined, 'all', undefined, undefined, 'all');
    });
  });

  describe('Regras de Negócio e Mudança Assíncrona Atômica ($transaction em UI)', () => {
    it('deve alternar a visualização para turmas arquivadas', () => {
      fixture.detectChanges();
      component.mudarAba('ARQUIVADO');
      
      expect(component.abaAtiva()).toBe('ARQUIVADO');
      const filtradas = component.turmasFiltradas();
      expect(filtradas.length).toBe(1);
      expect(filtradas[0].nome).toBe('Oficina Inativa');
    });

    it('deve impedir que PROFESSOR archive uma oficina', async () => {
      mockAuthService.getUser.mockReturnValue({ role: 'PROFESSOR' });
      fixture.detectChanges(); // Reavalia Perfil

      await component.alternarArquivamento('100', false, new Event('click'));
      
      expect(mockToast.erro).toHaveBeenCalledWith('Ação não permitida para o seu perfil.');
      expect(mockConfirmDialog.confirmar).not.toHaveBeenCalled();
    });

    it('deve gerenciar estado com segurança ao falhar salvar persistência API', () => {
      fixture.detectChanges();
      component.abrirModalCriar();
      
      mockTurmasService.criar.mockReturnValue(throwError(() => ({ error: { message: 'Erro Banco Fake' } })));
      
      component.salvarOficina({ nome: 'Valid' } as any);

      expect(component.salvandoTurma()).toBe(false);
      expect(component.erroSalvarTurma()).toBe('Erro Banco Fake');
      expect(mockToast.erro).toHaveBeenCalledWith('Erro Banco Fake');
      expect(mockToast.sucesso).not.toHaveBeenCalled();
    });

    it('deve executar o desarquivamento de uma turma validando transação com DialogService', async () => {
      fixture.detectChanges();
      
      // Simula conformação de UX do administrador
      mockConfirmDialog.confirmar.mockResolvedValue(true);
      mockTurmasService.restaurar.mockReturnValue(
        of({ id: '101', nome: 'Oficina Inativa', status: 'PREVISTA', statusAtivo: true })
      );

      await component.alternarArquivamento('101', true, new Event('click'));
      
      expect(mockConfirmDialog.confirmar).toHaveBeenCalledWith({
        titulo: 'Desarquivar a oficina?',
        mensagem: 'A oficina voltará a aparecer na aba de Ativas.',
        textoBotaoConfirmar: 'Sim, desarquivar'
      });
      
      expect(mockTurmasService.restaurar).toHaveBeenCalledWith('101');
      expect(component.turmas()[1]).toEqual(
        expect.objectContaining({
          status: 'PREVISTA',
          statusAtivo: true
        })
      );
      expect(mockToast.sucesso).toHaveBeenCalledWith('Oficina desarquivada com sucesso.');
    });

    it('deve mudar status rapido pelo endpoint dedicado e refletir statusAtivo retornado pela API', async () => {
      fixture.detectChanges();
      mockConfirmDialog.confirmar.mockResolvedValue(true);
      mockTurmasService.mudarStatus.mockReturnValue(
        of({ id: '100', nome: 'Oficina Ativa', status: 'CONCLUIDA', statusAtivo: false })
      );

      await component.atualizarStatusRapido(component.turmas()[0], 'CONCLUIDA');

      expect(mockTurmasService.mudarStatus).toHaveBeenCalledWith('100', 'CONCLUIDA');
      expect(mockTurmasService.atualizar).not.toHaveBeenCalled();
      expect(component.turmas()[0]).toEqual(
        expect.objectContaining({
          status: 'CONCLUIDA',
          statusAtivo: false
        })
      );
      expect(mockToast.sucesso).toHaveBeenCalledWith('Oficina alterada para CONCLUIDA');
    });
  });

  describe('Helpers e Formatações Puras de UI', () => {
    it('deve formatar adequadamente uma grade horária inexistente para "a definir"', () => {
      expect(component.formatarGradeHoraria(null as any)).toBe('Horário a definir');
    });

    it('deve formatar arrays de minutos puros retornados do Banco em Horas legíveis pela Acessibilidade e Usuário Exigente', () => {
      const g = component.formatarGradeHoraria([{ dia: 'SEG', horaInicio: 480, horaFim: 540 }]);
      expect(g).toBe('SEG 08:00-09:00');
    });
  });
});
