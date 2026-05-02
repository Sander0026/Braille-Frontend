import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';

import { SiteConfigService } from '../../../core/services/site-config';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { AnimateOnScrollDirective } from '../../../shared/directives/animate-on-scroll.directive';

interface TimelineItem { ano: string; titulo: string; descricao: string; }
interface EquipeMembro { emoji: string; cargo: string; descricao: string; }

const DEFAULTS = {
  hero: {
    eyebrow: 'Conheça o Instituto',
    titulo: 'Sobre o Instituto Luiz Braille',
    descricao: 'Uma história de mais de 30 anos dedicada à inclusão,\nautonomia e dignidade de pessoas com deficiência visual.',
  },
  historia: {
    titulo: 'Nossa História',
    paragrafo1: 'O Instituto Luiz Braille foi fundado com a missão de oferecer reabilitação, educação e inclusão social para pessoas com deficiência visual. Ao longo de décadas, crescemos e nos consolidamos como referência regional no atendimento especializado a essa população.',
    paragrafo2: 'Nosso trabalho é sustentado pela crença de que toda pessoa, independentemente de sua condição visual, tem direito a uma vida plena, produtiva e com autonomia. Oferecemos todos os nossos serviços de forma gratuita, sem distinção de renda, raça ou religião.',
    paragrafo3: 'Somos uma entidade sem fins lucrativos, mantida por parcerias com o poder público, empresas e doações de pessoas comprometidas com a causa da inclusão.',
  },
  timeline: [
    { ano: '1990', titulo: 'Fundação',             descricao: 'Criação do instituto com foco em reabilitação visual básica.' },
    { ano: '2000', titulo: 'Expansão das oficinas', descricao: 'Ampliação para 6 oficinas e abertura de turmas para adultos.' },
    { ano: '2010', titulo: 'Inclusão digital',      descricao: 'Implantação do laboratório de informática acessível.' },
    { ano: 'Hoje', titulo: '300+ alunos por ano',   descricao: 'Referência regional em educação inclusiva e autonomia visual.' },
  ] as TimelineItem[],
  equipe: [
    { emoji: 'manage_accounts', cargo: 'Coordenação Pedagógica', descricao: 'Planejamento e acompanhamento de todos os programas educacionais.' },
    { emoji: 'school',          cargo: 'Professores Especialistas', descricao: 'Professores com formação em educação especial e reabilitação visual.' },
    { emoji: 'people',          cargo: 'Assistência Social',        descricao: 'Acompanhamento socioeconômico e encaminhamento para políticas públicas.' },
    { emoji: 'devices',         cargo: 'Tecnologia Assistiva',      descricao: 'Equipe de suporte para leitores de tela e recursos digitais acessíveis.' },
  ] as EquipeMembro[],
  cta: {
    titulo:   'Quer saber mais ou precisa de atendimento?',
    descricao: 'Entre em contato com nossa secretaria. O atendimento é gratuito e humanizado.',
  },
};

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeHtmlPipe, AnimateOnScrollDirective],
  templateUrl: './sobre.html',
  styleUrl: './sobre.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sobre {

  // ── DI via inject() — campo-level = injection context válido ─────────────────
  private readonly siteConfig = inject(SiteConfigService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Estado reativo ────────────────────────────────────────────────────────────
  hero     = signal({ ...DEFAULTS.hero });
  historia = signal({ ...DEFAULTS.historia });
  timeline = signal<TimelineItem[]>([...DEFAULTS.timeline]);
  equipe   = signal<EquipeMembro[]>([...DEFAULTS.equipe]);
  cta      = signal({ ...DEFAULTS.cta });

  constructor() {
    this.carregarConfiguracoesLayout();
  }

  private carregarConfiguracoesLayout(): void {
    /**
     * CORREÇÃO NG0203: carregarConfiguracoesLayout() é um método privado —
     * mesmo chamado do constructor, ele NÃO herda o injection context.
     * Solução: passar this.destroyRef explicitamente.
     * O take(1) já garante que o observable completa, mas o takeUntilDestroyed
     * adiciona segurança caso o componente seja destruído antes do primeiro emit.
     */
    this.siteConfig.secoes$.pipe(
      filter(s => Object.keys(s).length > 0),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(secoes => {
      const h = secoes['sobre_hero'];
      if (h?.['titulo']) {
        this.hero.set({
          eyebrow:  h['eyebrow']  || DEFAULTS.hero.eyebrow,
          titulo:   h['titulo'],
          descricao: h['descricao'] || DEFAULTS.hero.descricao,
        });
      }

      const hist = secoes['sobre_historia'];
      if (hist?.['paragrafo1']) {
        this.historia.set({
          titulo:    hist['titulo']    || DEFAULTS.historia.titulo,
          paragrafo1: hist['paragrafo1'] || '',
          paragrafo2: hist['paragrafo2'] || '',
          paragrafo3: hist['paragrafo3'] || '',
        });
      }

      const tl = secoes['sobre_timeline'];
      if (tl?.['lista']) {
        try {
          const parsed = JSON.parse(tl['lista']) as TimelineItem[];
          if (parsed.length > 0) this.timeline.set(parsed);
        } catch { /* Silencia JSON malformado — sem crash de UI (OWASP) */ }
      }

      const eq = secoes['sobre_equipe'];
      if (eq?.['lista']) {
        try {
          const parsed = JSON.parse(eq['lista']) as EquipeMembro[];
          if (parsed.length > 0) this.equipe.set(parsed);
        } catch { /* Silencia JSON malformado — sem crash de UI (OWASP) */ }
      }

      const ctaMeta = secoes['sobre_cta'];
      if (ctaMeta?.['titulo']) {
        this.cta.set({
          titulo:    ctaMeta['titulo'],
          descricao: ctaMeta['descricao'] || DEFAULTS.cta.descricao,
        });
      }
    });
  }
}
