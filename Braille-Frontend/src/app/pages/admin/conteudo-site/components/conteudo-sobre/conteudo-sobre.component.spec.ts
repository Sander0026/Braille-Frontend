import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ConteudoSobreComponent } from './conteudo-sobre.component';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { QuillModule } from 'ngx-quill';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ConteudoSobreComponent', () => {
  let component: ConteudoSobreComponent;
  let fixture: ComponentFixture<ConteudoSobreComponent>;
  let siteConfigSpy: any;
  let toastSpy: any;
  let secoesSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    secoesSubject = new BehaviorSubject<{ [key: string]: any }>({});

    siteConfigSpy = {
        salvarSecao: vi.fn(),
        carregarSecoes: vi.fn()
    };
    Object.defineProperty(siteConfigSpy, 'secoes$', { get: () => secoesSubject.asObservable() });
    siteConfigSpy.salvarSecao.mockReturnValue(of(true));
    siteConfigSpy.carregarSecoes.mockReturnValue(of(true));

    toastSpy = {
        sucesso: vi.fn(),
        erro: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ConteudoSobreComponent, ReactiveFormsModule, QuillModule.forRoot()],
      providers: [
        { provide: SiteConfigService, useValue: siteConfigSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConteudoSobreComponent);
    component = fixture.componentInstance;
  });

  it('deve instanciar', () => {
    expect(component).toBeTruthy();
  });

  it('nao deve injetar formValues se o payload das secoes for vazio', () => {
    fixture.detectChanges();
    expect(component.carregando()).toBe(true);
  });

  it('deve parsear JSON corretamente e preencher arrays dinamicos de FormArrays (Timeline e Equipe)', () => {
    const dbMock = {
      sobre_hero: { titulo: 'O Início', descricao: 'Test', eyebrow: 'Hero' },
      sobre_timeline: { lista: JSON.stringify([{ ano: '2010', titulo: 'Fundacao', descricao: 'Criada' }]) },
      sobre_equipe: { lista: JSON.stringify([{ emoji: 'person', cargo: 'CEO', descricao: '' }]) }
    };
    
    secoesSubject.next(dbMock);
    fixture.detectChanges(); // chama ngOnInit

    expect(component.carregando()).toBe(false);
    expect(component.formSobreHero.value.titulo).toBe('O Início');
    expect(component.timelineArray.length).toBe(1);
    expect(component.equipeArray.length).toBe(1);
  });

  describe('Edicao de Elementos Dinamicos (Timeline e Equipe)', () => {
    beforeEach(() => { fixture.detectChanges(); }); // Inicia vazio

    it('deve adicionar um item vazio no array de timeline', () => {
      component.adicionarItemTimeline();
      expect(component.timelineArray.length).toBe(1);
      expect(component.timelineArray.at(0).valid).toBe(false); 
    });

    it('deve iniciar tela de exclusao guardando o indice/target para remover mais tarde', () => {
      component.pedirExclusao(1, 'timeline');
      expect(component.itemParaExcluir()).toEqual({ index: 1, tipo: 'timeline' });
    });

    it('deve confirmar exclusao removendo o item especifico do formArray exato e cancelando modal', () => {
      component.adicionarItemTimeline();
      component.adicionarItemTimeline();
      expect(component.timelineArray.length).toBe(2);

      component.pedirExclusao(0, 'timeline');
      component.confirmarExclusao();

      expect(component.timelineArray.length).toBe(1);
      expect(component.itemParaExcluir()).toBeNull();
    });
  });

  describe('Acoes de Persistencia (Salvar Secoes)', () => {
    beforeEach(() => { fixture.detectChanges(); }); 

    it('deve formatar valor Array como string JSON pra persistencia no Banco (Timeline)', () => {
      component.adicionarItemTimeline();
      component.timelineArray.at(0).patchValue({ ano: '2023', titulo: 'Teste', descricao: 'Desc' });
      
      component.salvarSobreTimeline();

      expect(siteConfigSpy.salvarSecao).toHaveBeenCalled();
      expect(toastSpy.sucesso).toHaveBeenCalled();
      expect(component.salvandoTimeline()).toBe(false);
    });

    it('deve notificar Erro se salvarHistoria falhar no HTTP', () => {
      siteConfigSpy.salvarSecao.mockReturnValue(throwError(() => new Error('API down')));
      
      component.formSobreHistoria.patchValue({ titulo: 'Nova', paragrafo1: 'Um par' });
      component.salvarSobreHistoria();

      expect(toastSpy.erro).toHaveBeenCalled();
      expect(component.salvandoHistoria()).toBe(false);
    });
  });
});
