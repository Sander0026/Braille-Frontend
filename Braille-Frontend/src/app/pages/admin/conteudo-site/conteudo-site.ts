import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConteudoConfigComponent } from './components/conteudo-config/conteudo-config.component';
import { ConteudoInstitucionalComponent } from './components/conteudo-institucional/conteudo-institucional.component';
import { ConteudoDinamicoComponent } from './components/conteudo-dinamico/conteudo-dinamico.component';
import { ConteudoSobreComponent } from './components/conteudo-sobre/conteudo-sobre.component';
import { ConteudoContatoComponent } from './components/conteudo-contato/conteudo-contato.component';
import { ComunicadosLista } from './components/comunicados-lista/comunicados-lista';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { inject } from '@angular/core';

type AbaAtiva = 'config' | 'hero' | 'missao' | 'oficinas' | 'depoimentos' | 'sobre' | 'comunicados' | 'faq' | 'contato';

@Component({
  selector: 'app-conteudo-site',
  standalone: true,
  imports: [
    CommonModule, 
    ConteudoConfigComponent, 
    ConteudoInstitucionalComponent, 
    ConteudoDinamicoComponent, 
    ConteudoSobreComponent, 
    ConteudoContatoComponent, 
    ComunicadosLista,
    A11yModule
  ],
  templateUrl: './conteudo-site.html',
  styleUrls: ['./conteudo-site.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConteudoSite {
  abaAtiva = signal<AbaAtiva>('config');
  private readonly announcer = inject(LiveAnnouncer);

  setAba(aba: AbaAtiva) {
    this.abaAtiva.set(aba);
    
    // Feedback orgânico (Screen Readers) de mudança de painel ativo.
    const titulos: Record<string, string> = {
      config: 'Configurações Globais',
      hero: 'Apresentação Principal',
      missao: 'Missão e Valores',
      oficinas: 'Oficinas',
      depoimentos: 'Depoimentos',
      sobre: 'Página Sobre Nós',
      comunicados: 'Painel de Noticias',
      faq: 'Perguntas Frequentes',
      contato: 'Visão de Contatos'
    };
    this.announcer.announce(`Aba de navegação alternada para: ${titulos[aba] ?? aba}.`, 'polite');
  }

  // Acessibilidade WCAG - Seleção de Tabs via Teclado
  handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (!target || target.getAttribute('role') !== 'tab') return;

    const tabsList = Array.from(target.parentElement!.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const index = tabsList.indexOf(target);
    let newIndex = index;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      newIndex = (index + 1) % tabsList.length;
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      newIndex = (index - 1 + tabsList.length) % tabsList.length;
      event.preventDefault();
    }

    if (newIndex !== index) {
      tabsList[newIndex].focus();
      tabsList[newIndex].click();
    }
  }
}
