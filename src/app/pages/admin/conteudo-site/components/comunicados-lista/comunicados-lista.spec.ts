import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ComunicadosLista } from './comunicados-lista';
import { ComunicadosService } from '../../../../../core/services/comunicados.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { QuillModule } from 'ngx-quill';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ComunicadosLista Component', () => {
  let component: ComunicadosLista;
  let fixture: ComponentFixture<ComunicadosLista>;
  
  let comunicadosSpy: any;
  let toastSpy: any;
  let httpSpy: any;
  let paramsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    paramsSubject = new BehaviorSubject<{ [key: string]: any }>({});
    
    comunicadosSpy = {
        listar: vi.fn(),
        criar: vi.fn(),
        atualizar: vi.fn(),
        excluir: vi.fn()
    };
    comunicadosSpy.listar.mockReturnValue(of({ data: [{ id: '1', titulo: 'Com_1', conteudo: 'C', categoria: 'GERAL' }] }));
    comunicadosSpy.criar.mockReturnValue(of(true));
    comunicadosSpy.atualizar.mockReturnValue(of(true));
    comunicadosSpy.excluir.mockReturnValue(of(true));

    toastSpy = {
        sucesso: vi.fn(),
        erro: vi.fn()
    };
    httpSpy = { post: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ComunicadosLista, ReactiveFormsModule, QuillModule.forRoot()],
      providers: [
        { provide: ComunicadosService, useValue: comunicadosSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: HttpClient, useValue: httpSpy },
        { provide: ActivatedRoute, useValue: { queryParams: paramsSubject.asObservable() } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ComunicadosLista);
    component = fixture.componentInstance;
    
    vi.spyOn(component, 'podeDescartar').mockResolvedValue(true);
  });

  it('deve observar os queryParams route param "novo" e ativar tela de criacao automaticamente', async () => {
      const spyNovo = vi.spyOn(component, 'novo');
      fixture.detectChanges();
      paramsSubject.next({ novo: 'true', categoria: 'NOTICIA' });
      await new Promise(r => setTimeout(r, 150));
      expect(spyNovo).toHaveBeenCalledWith('NOTICIA');
  });

  it('Salvar: deve mapear id e acionar Update API em caso de editando() persistido anteriomente', async () => {
      fixture.detectChanges();
      const c = { id: 'xy', titulo: 'A', conteudo: 'B', categoria: 'NOTICIA', createdAt: '', updatedAt: '' } as any;
      component.editar(c);
      component.form.patchValue({ titulo: 'Valid Title', conteudo: 'Valid Conteudo text longo', categoria: 'NOTICIA' });

      await component.salvar();

      expect(comunicadosSpy.atualizar).toHaveBeenCalled();
      expect(comunicadosSpy.atualizar.mock.calls[0][0]).toBe('xy');
      expect(toastSpy.sucesso).toHaveBeenCalled();
  });
});
