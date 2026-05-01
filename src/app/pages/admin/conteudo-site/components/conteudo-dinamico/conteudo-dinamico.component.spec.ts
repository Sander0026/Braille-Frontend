import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ConteudoDinamicoComponent } from './conteudo-dinamico.component';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { QuillModule } from 'ngx-quill';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ConteudoDinamicoComponent', () => {
  let component: ConteudoDinamicoComponent;
  let fixture: ComponentFixture<ConteudoDinamicoComponent>;
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
      imports: [ConteudoDinamicoComponent, ReactiveFormsModule, QuillModule.forRoot()],
      providers: [
        { provide: SiteConfigService, useValue: siteConfigSpy },
        { provide: ToastService, useValue: toastSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConteudoDinamicoComponent);
    component = fixture.componentInstance;
    component.abaAtiva = 'faq'; 
  });

  it('deve contornar objeto vazio vindo do cache e estabilizar loading via filter', async () => {
    fixture.detectChanges();
    await new Promise(r => setTimeout(r, 10));
    expect(component.carregando()).toBe(true);
  });

  it('deve deletar index alvo de oficinasArray pela modal de confirmacao e nullificar a delecao', () => {
      fixture.detectChanges();
      component.adicionarOficina();
      component.adicionarOficina();
      component.oficinasArray.at(1).patchValue({ titulo: 'Alvo' });

      component.pedirExclusao(1, 'oficina');
      component.confirmarExclusao();

      expect(component.oficinasArray.length).toBe(1);
      expect(component.itemParaExcluir()).toBeNull();
  });

  it('deve converter formularios de FormArray em String Array-Format para persistencia local do FAQ e acionar o refetch', async () => {
      fixture.detectChanges();
      component.adicionarFaq();
      component.faqArray.at(0).patchValue({ pergunta: 'P?', resposta: 'R!' });

      component.salvarFaq();
      await new Promise(r => setTimeout(r, 10));

      expect(siteConfigSpy.salvarSecao).toHaveBeenCalled();
      expect(toastSpy.sucesso).toHaveBeenCalled();
      expect(component.salvando()).toBe(false);
  });
});
