import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteConfigService } from '../../../core/services/site-config';
import { filter, take } from 'rxjs/operators';

interface TimelineItem { ano: string; titulo: string; descricao: string; }
interface EquipeMembro { emoji: string; cargo: string; descricao: string; }

// Valores padrão caso o admin ainda não tenha salvo os dados
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
        { ano: '1990', titulo: 'Fundação', descricao: 'Criação do instituto com foco em reabilitação visual básica.' },
        { ano: '2000', titulo: 'Expansão das oficinas', descricao: 'Ampliação para 6 oficinas e abertura de turmas para adultos.' },
        { ano: '2010', titulo: 'Inclusão digital', descricao: 'Implantação do laboratório de informática acessível.' },
        { ano: 'Hoje', titulo: '300+ alunos por ano', descricao: 'Referência regional em educação inclusiva e autonomia visual.' },
    ] as TimelineItem[],
    equipe: [
        { emoji: '👩‍⚕️', cargo: 'Coordenação Pedagógica', descricao: 'Planejamento e acompanhamento de todos os programas educacionais.' },
        { emoji: '👩‍🏫', cargo: 'Professores Especialistas', descricao: 'Professores com formação em educação especial e reabilitação visual.' },
        { emoji: '🤝', cargo: 'Assistência Social', descricao: 'Acompanhamento socioeconômico e encaminhamento para políticas públicas.' },
        { emoji: '🖥️', cargo: 'Tecnologia Assistiva', descricao: 'Equipe de suporte para leitores de tela e recursos digitais acessíveis.' },
    ] as EquipeMembro[],
    cta: {
        titulo: 'Quer saber mais ou precisa de atendimento?',
        descricao: 'Entre em contato com nossa secretaria. O atendimento é gratuito e humanizado.',
    },
};

@Component({
    selector: 'app-sobre',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './sobre.html',
    styleUrl: './sobre.scss',
})
export class Sobre implements OnInit {
    hero = { ...DEFAULTS.hero };
    historia = { ...DEFAULTS.historia };
    timeline: TimelineItem[] = [...DEFAULTS.timeline];
    equipe: EquipeMembro[] = [...DEFAULTS.equipe];
    cta = { ...DEFAULTS.cta };

    constructor(private siteConfig: SiteConfigService) { }

    ngOnInit(): void {
        this.siteConfig.secoes$.pipe(
            filter(s => Object.keys(s).length > 0),
            take(1)
        ).subscribe(secoes => {
            // Hero
            const h = secoes['sobre_hero'];
            if (h?.['titulo']) this.hero = { eyebrow: h['eyebrow'] || DEFAULTS.hero.eyebrow, titulo: h['titulo'], descricao: h['descricao'] || DEFAULTS.hero.descricao };

            // História
            const hist = secoes['sobre_historia'];
            if (hist?.['paragrafo1']) this.historia = {
                titulo: hist['titulo'] || DEFAULTS.historia.titulo,
                paragrafo1: hist['paragrafo1'] || '',
                paragrafo2: hist['paragrafo2'] || '',
                paragrafo3: hist['paragrafo3'] || '',
            };

            // Timeline
            const tl = secoes['sobre_timeline'];
            if (tl?.['lista']) {
                try {
                    const parsed = JSON.parse(tl['lista']) as TimelineItem[];
                    if (parsed.length > 0) this.timeline = parsed;
                } catch { /* mantém default */ }
            }

            // Equipe
            const eq = secoes['sobre_equipe'];
            if (eq?.['lista']) {
                try {
                    const parsed = JSON.parse(eq['lista']) as EquipeMembro[];
                    if (parsed.length > 0) this.equipe = parsed;
                } catch { /* mantém default */ }
            }

            // CTA
            const cta = secoes['sobre_cta'];
            if (cta?.['titulo']) this.cta = { titulo: cta['titulo'], descricao: cta['descricao'] || DEFAULTS.cta.descricao };
        });
    }
}
