import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';

import { BeneficiaryList } from './beneficiary-list';
import { BeneficiariosService } from '../../../core/services/beneficiarios.service';

describe('BeneficiaryList', () => {
  let component: BeneficiaryList;
  let fixture: ComponentFixture<BeneficiaryList>;
  let beneficiariosService: any;

  beforeEach(async () => {
    beneficiariosService = {
      listar: () => of({ items: [], total: 0 }),
    };

    await TestBed.configureTestingModule({
      imports: [BeneficiaryList, HttpClientTestingModule, A11yModule],
      providers: [
        { provide: BeneficiariosService, useValue: beneficiariosService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BeneficiaryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Acessibilidade (a11y)', () => {
    it('deve possuir aria-label explícito em todos os botões que não possuem texto direto na tela (apenas ícones)', () => {
      component.abaAtiva = 'ativos';
      component.alunos = [{
         id: '1', nomeCompleto: 'João', cpf: '111', statusAtivo: true, tipoDeficiencia: 'VISUAL' 
      }] as any;
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      let iconButtons: HTMLButtonElement[] = [];
      
      buttons.forEach((btn: HTMLButtonElement) => {
         const hasText = btn.innerText && btn.innerText.trim().length > 0;
         const hasIcon = btn.querySelector('svg, span.material-symbols-rounded');
         const hasSrOnly = btn.querySelector('.sr-only');
         
         // Se não possui texto visível a olho nu, mas contem um ícone
         if (!hasText && hasIcon && !hasSrOnly) {
            iconButtons.push(btn);
         }
      });
      
      iconButtons.forEach(btn => {
         const srLabel = btn.getAttribute('aria-label');
         expect(srLabel).toBeTruthy();
      });
    });

    it('deve comunicar regiões de carregamento ao leitor com aria-live="polite" e aria-busy="true"', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const loadingDiv = fixture.nativeElement.querySelector('.data-table-wrapper[aria-busy="true"]');
      expect(loadingDiv).toBeTruthy();
      expect(loadingDiv.getAttribute('aria-live')).toBe('polite');
      const textProcessing = loadingDiv.querySelector('.loading-container');
      expect(textProcessing).toBeTruthy();
    });

    it('deve invocar e manter as marcações de Focus Trap Condicional em Modais/Drawer de Filtro', () => {
      component.drawerAberto = true;
      fixture.detectChanges();
      
      const drawer = fixture.nativeElement.querySelector('#filter-drawer-panel');
      expect(drawer).toBeTruthy();
      expect(drawer.hasAttribute('cdkTrapFocus')).toBe(true);
      expect(drawer.getAttribute('role')).toBe('dialog');
      expect(drawer.getAttribute('aria-modal')).toBe('true');
    });
  });
});
