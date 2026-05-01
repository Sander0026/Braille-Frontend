import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ConteudoContatoComponent } from './conteudo-contato.component';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { QuillModule } from 'ngx-quill';
import { NO_ERRORS_SCHEMA } from '@angular/core';



describe('ConteudoContatoComponent', () => {
  let component: ConteudoContatoComponent;
  let fixture: ComponentFixture<ConteudoContatoComponent>;
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
      imports: [ConteudoContatoComponent, ReactiveFormsModule, QuillModule.forRoot()],
      providers: [
        { provide: SiteConfigService, useValue: siteConfigSpy },
        { provide: ToastService, useValue: toastSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConteudoContatoComponent);
    component = fixture.componentInstance;
  });

  it('deve instanciar', () => {
    expect(component).toBeTruthy();
  });

  it('deve preencher signal e form quando acionado ediÃ§Ã£o via payload', () => {
      secoesSubject.next({
          contato_global: { telefoneCentral: '0800 123', emailOficial: 'admin@b.com' }
      });
      fixture.detectChanges();

      expect(component.carregando()).toBe(false);
      expect(component.formContato.value.telefoneCentral).toBe('0800 123');
  });

  it('deve empacotar JSON reativo como payload e requisitar persistencia via service com refetch de tela', () => {
      fixture.detectChanges();
      component.formContato.patchValue({ emailOficial: 'valid@mail.com', youtube: 'yt.com' });

      component.salvarContato();

      expect(siteConfigSpy.salvarSecao).toHaveBeenCalled();
      expect(toastSpy.sucesso).toHaveBeenCalled();
      expect(component.salvando()).toBe(false);
  });
});

