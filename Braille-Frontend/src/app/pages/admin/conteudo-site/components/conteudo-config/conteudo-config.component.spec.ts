import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ConteudoConfigComponent } from './conteudo-config.component';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';



describe('ConteudoConfigComponent', () => {
  let component: ConteudoConfigComponent;
  let fixture: ComponentFixture<ConteudoConfigComponent>;
  let siteConfigSpy: any;
  let toastSpy: any;
  let httpSpy: any;
  let configsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    configsSubject = new BehaviorSubject<any>({});
    
    siteConfigSpy = { salvarConfigs: vi.fn(), carregarConfigs: vi.fn() };
    Object.defineProperty(siteConfigSpy, 'configs$', { get: () => configsSubject.asObservable() });
    siteConfigSpy.salvarConfigs.mockReturnValue(of(true));
    siteConfigSpy.carregarConfigs.mockReturnValue(of(true));

    toastSpy = { sucesso: vi.fn(), erro: vi.fn() };
    httpSpy = { post: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConteudoConfigComponent, ReactiveFormsModule],
      providers: [
        { provide: SiteConfigService, useValue: siteConfigSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: HttpClient, useValue: httpSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConteudoConfigComponent);
    component = fixture.componentInstance;
  });

  it('deve instanciar', () => {
    expect(component).toBeTruthy();
  });

  it('deve formatar configs do payload config_global no Init', () => {
    configsSubject.next({ fachadaUrl: 'http://myfachada' });

    fixture.detectChanges();

    expect(component.formConfig.value.fachadaUrl).toBe('http://myfachada');
    expect(component.fachadaPreview()).toBe('http://myfachada');
  });

  it('deve rejeitar upload de fachada acima de 2MB e limpar campos', async () => {
    const file = new File([''], 'img.jpg');
    Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 });

    const event = { target: { files: [file] } } as unknown as Event;
    await component.onFachadaChange(event);

    expect(toastSpy.erro).toHaveBeenCalled();
  });

  it('deve rejeitar persistencia se o form for invalido', () => {
    component.formConfig.setErrors({ invalid: true });
    component.salvarConfig();
    expect(siteConfigSpy.salvarConfigs).not.toHaveBeenCalled();
  });

  it('deve realizar persistencia de config e recarregar status do Service sem anexo', () => {
    component.formConfig.patchValue({ fachadaUrl: 'url' });

    component.salvarConfig();

    expect(httpSpy.post).not.toHaveBeenCalled();
    expect(siteConfigSpy.salvarConfigs).toHaveBeenCalled();
    expect(toastSpy.sucesso).toHaveBeenCalled();
    expect(siteConfigSpy.carregarConfigs).toHaveBeenCalled();
  });

  it('deve notificar cancelamento/confirmacao exclusao fachada modal', () => {
    component.removerFachada();
    expect(component.fachadaParaExcluir()).toBe(true);

    component.confirmarExclusaoFachada();
    expect(component.fachadaParaExcluir()).toBe(false);
    expect(component.fachadaPreview()).toBeNull();
  });
});

