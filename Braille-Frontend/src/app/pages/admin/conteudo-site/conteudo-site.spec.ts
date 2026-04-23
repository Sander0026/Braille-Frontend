import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ConteudoSite } from './conteudo-site';
import { ConteudoConfigComponent } from './components/conteudo-config/conteudo-config.component';
import { ConteudoInstitucionalComponent } from './components/conteudo-institucional/conteudo-institucional.component';
import { ConteudoDinamicoComponent } from './components/conteudo-dinamico/conteudo-dinamico.component';
import { ConteudoSobreComponent } from './components/conteudo-sobre/conteudo-sobre.component';
import { ConteudoContatoComponent } from './components/conteudo-contato/conteudo-contato.component';
import { ComunicadosLista } from './components/comunicados-lista/comunicados-lista';
import { A11yModule } from '@angular/cdk/a11y';




// â”€â”€ Mock Standalone Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Component({ selector: 'app-conteudo-config', standalone: true, template: '' })
class MockConfig {}

@Component({ selector: 'app-conteudo-institucional', standalone: true, template: '' })
class MockInstitucional {}

@Component({ selector: 'app-conteudo-dinamico', standalone: true, template: '' })
class MockDinamico {}

@Component({ selector: 'app-conteudo-sobre', standalone: true, template: '' })
class MockSobre {}

@Component({ selector: 'app-conteudo-contato', standalone: true, template: '' })
class MockContato {}

@Component({ selector: 'app-comunicados-lista', standalone: true, template: '' })
class MockComunicados {}

describe('ConteudoSite Component (Container CMS)', () => {
  let component: ConteudoSite;
  let fixture: ComponentFixture<ConteudoSite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConteudoSite, A11yModule]
    })
    .overrideComponent(ConteudoSite, {
      remove: {
        imports: [
          ConteudoConfigComponent,
          ConteudoInstitucionalComponent,
          ConteudoDinamicoComponent,
          ConteudoSobreComponent,
          ConteudoContatoComponent,
          ComunicadosLista
        ]
      },
      add: {
        imports: [
          MockConfig, MockInstitucional, MockDinamico, MockSobre, MockContato, MockComunicados
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConteudoSite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve instanciar o componente raiz do CMS de forma correta', () => {
    expect(component).toBeTruthy();
  });

  describe('Fluxo e MutaÃ§Ã£o de Abas Reativas (Signals)', () => {
    it('deve inicializar com aba "config" nativamente', () => {
      expect(component.abaAtiva()).toBe('config');
    });

    it('deve alterar e refletir aba ativa dinamicamente ao disparar setAba()', () => {
      component.setAba('hero');
      expect(component.abaAtiva()).toBe('hero');

      component.setAba('comunicados');
      expect(component.abaAtiva()).toBe('comunicados');
    });

    it('deve aplicar classe de estilo "ativo" (tab estÃ©tico) se for a aba visualizada', () => {
      component.setAba('sobre');
      fixture.detectChanges(); // atualiza render HTML

      const tabs = fixture.debugElement.queryAll(By.css('.tab-btn'));
      const activeTab = tabs.find(t => t.nativeElement.classList.contains('active'));
      
      expect(activeTab).toBeTruthy();
      expect(activeTab?.nativeElement.textContent.trim().toLowerCase()).toContain('sobre');
    });
  });

  describe('Acessibilidade (WCAG - Arrow Keys Navigation)', () => {
    let mockKeyboardEvent: (key: string, targetMock?: any) => KeyboardEvent;

    beforeEach(() => {
      // Stub para o DOM event
      mockKeyboardEvent = (key: string, targetMock?: any) => {
        return {
          key,
          target: targetMock || null,
          preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
      };
    });

    it('deve abortar handleKeydown silenciosamente em target incorreto ou papel nao-tab', () => {
      const pTarget = document.createElement('p');
      pTarget.setAttribute('role', 'button'); 

      const event = mockKeyboardEvent('ArrowRight', pTarget);
      
      // Act 
      expect(() => component.handleKeydown(event)).not.toThrow();
    });

    it('deve rotacionar tabs para a DIREITA / BAIXO adequadamente (+1 indexaÃ§Ã£o circular)', () => {
      const divContainer = document.createElement('div');
      const tab1 = document.createElement('button'); tab1.setAttribute('role', 'tab');
      const tab2 = document.createElement('button'); tab2.setAttribute('role', 'tab');
      
      const spyFocus2 = vi.spyOn(tab2, 'focus');
      const spyClick2 = vi.spyOn(tab2, 'click');

      divContainer.appendChild(tab1);
      divContainer.appendChild(tab2);

      const event = mockKeyboardEvent('ArrowRight', tab1);
      component.handleKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(spyFocus2).toHaveBeenCalled();
      expect(spyClick2).toHaveBeenCalled();
    });

    it('deve rotacionar tabs para a ESQUERDA / CIMA adequadamente (-1 indexaÃ§Ã£o circular overflow-handling)', () => {
        const divContainer = document.createElement('div');
        const tab1 = document.createElement('button'); tab1.setAttribute('role', 'tab');
        const tab2 = document.createElement('button'); tab2.setAttribute('role', 'tab');
        
        const spyFocus2 = vi.spyOn(tab2, 'focus');
        const spyClick2 = vi.spyOn(tab2, 'click');
  
        divContainer.appendChild(tab1);
        divContainer.appendChild(tab2);
  
        const event = mockKeyboardEvent('ArrowLeft', tab1);
        component.handleKeydown(event);
  
        expect(event.preventDefault).toHaveBeenCalled();
        expect(spyFocus2).toHaveBeenCalled();
        expect(spyClick2).toHaveBeenCalled();
      });
  });
});

