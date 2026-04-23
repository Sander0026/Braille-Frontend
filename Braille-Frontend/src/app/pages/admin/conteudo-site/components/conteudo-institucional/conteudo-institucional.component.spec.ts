import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ConteudoInstitucionalComponent } from './conteudo-institucional.component';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { QuillModule } from 'ngx-quill';
import { NO_ERRORS_SCHEMA } from '@angular/core';



describe('ConteudoInstitucionalComponent', () => {
  let component: ConteudoInstitucionalComponent;
  let fixture: ComponentFixture<ConteudoInstitucionalComponent>;
  let siteConfigSpy: any;
  let toastSpy: any;
  let secoesSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    secoesSubject = new BehaviorSubject<{ [key: string]: any }>({});
    
    siteConfigSpy = { salvarSecao: vi.fn(), carregarSecoes: vi.fn() };
    Object.defineProperty(siteConfigSpy, 'secoes$', { get: () => secoesSubject.asObservable() });
    siteConfigSpy.salvarSecao.mockReturnValue(of(true));
    siteConfigSpy.carregarSecoes.mockReturnValue(of(true));

    toastSpy = { sucesso: vi.fn(), erro: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConteudoInstitucionalComponent, ReactiveFormsModule, QuillModule.forRoot()],
      providers: [
        { provide: SiteConfigService, useValue: siteConfigSpy },
        { provide: ToastService, useValue: toastSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConteudoInstitucionalComponent);
    component = fixture.componentInstance;
    component.abaAtiva = 'hero'; 
  });

  it('deve extrair dados do Hero e Missao caso existam no Subject configurador', () => {
      secoesSubject.next({
        hero: { tituloLinha1: 'Chegou o Hero', btnPrimario: 'Acesse' },
        missao: { descricaoLinha1: 'Nossa MissÃ£o' }
      });

      fixture.detectChanges();

      expect(component.carregando()).toBe(false);
      expect(component.formHero.value.tituloLinha1).toBe('Chegou o Hero');
  });

  it('deve empacotar o formHero em Array Key-Value e requisitar salvamento disparando Sucesso', () => {
      fixture.detectChanges();
      component.formHero.patchValue({ tituloLinha1: 'Titulo Valido', btnPrimario: 'Ir' });
      
      component.salvarHero();

      expect(siteConfigSpy.salvarSecao).toHaveBeenCalled();
      expect(toastSpy.sucesso).toHaveBeenCalled();
      expect(component.salvando()).toBe(false);
  });

  it('deve alertar falha ao salvarMissao em caso de Erro de API', () => {
      fixture.detectChanges();
      siteConfigSpy.salvarSecao.mockReturnValue(throwError(() => new Error('Offline')));
      component.formMissao.patchValue({ descricaoLinha1: 'MissÃ£o' });
      
      component.salvarMissao();

      expect(toastSpy.erro).toHaveBeenCalled();
      expect(component.salvando()).toBe(false);
  });
});

