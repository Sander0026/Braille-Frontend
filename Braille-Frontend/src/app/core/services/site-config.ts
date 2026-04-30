import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

export interface SiteConfigMap {
  [chave: string]: string;
}

export type SecoesMap = Record<string, Record<string, string>>;

export interface ContatoGlobalConfig {
  heroDescricaoContato?: string;
  enderecoCompleto?: string;
  telefoneCentral?: string;
  emailOficial?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
  footerDireitos?: string;
  [chave: string]: string | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class SiteConfigService {
  private http = inject(HttpClient);
  private document = inject(DOCUMENT);
  private apiUrl = '/api';

  // ── Estado reativo: configs gerais (cor, logo…) ───────────
  private configsSubject = new BehaviorSubject<SiteConfigMap>({});
  public configs$ = this.configsSubject.asObservable();

  // ── Estado reativo: conteúdo das seções ───────────────────
  private secoesSubject = new BehaviorSubject<SecoesMap>({});
  public secoes$ = this.secoesSubject.asObservable();

  constructor() { }

  // ──────────────────────────────────────────────────────────
  // CONFIGS GERAIS
  // ──────────────────────────────────────────────────────────

  /**
   * Busca todas as configs gerais e atualiza o estado interno.
   * Chamado no boot do App (app.ts) e após salvar.
   */
  carregarConfigs(): Observable<SiteConfigMap> {
    return this.http.get<SiteConfigMap>(`${this.apiUrl}/site-config`).pipe(
      tap(configs => {
        this.configsSubject.next(configs);
        this.aplicarCorPrimaria(configs['corPrimaria']);
      })
    );
  }

  /**
   * Pega o valor atual síncrono de uma configuração específica.
   */
  getConfig(chave: string): string | undefined {
    return this.configsSubject.value[chave];
  }

  /**
   * Atualiza configs gerais no banco e recarrega o estado.
   */
  salvarConfigs(configs: { chave: string, valor: string }[]): Observable<any> {
    const body: Record<string, string> = {};
    configs.forEach(c => body[c.chave] = c.valor);
    // Sem tap de refresh — o componente faz o refresh após a UI atualizar
    return this.http.patch(`${this.apiUrl}/site-config`, body);
  }

  // ──────────────────────────────────────────────────────────
  // SEÇÕES DO SITE (hero, missão, oficinas…)
  // ──────────────────────────────────────────────────────────

  /**
   * Busca TODAS as seções de uma vez e atualiza o estado interno.
   * Chamado no boot do App (app.ts) e após cada salvarSecao().
   */
  carregarSecoes(): Observable<SecoesMap> {
    return this.http.get<SecoesMap>(`${this.apiUrl}/site-config/secoes`).pipe(
      tap(secoes => this.secoesSubject.next(secoes))
    );
  }

  /**
   * Retorna um Observable reativo de uma seção específica.
   * Todos os componentes que usam getSecao() passam a receber
   * atualizações automáticas quando o admin salvar.
   */
  getSecao(secao: string): Observable<Record<string, string>> {
    return this.secoes$.pipe(
      map(secoes => secoes[secao] ?? {})
    );
  }

  /**
   * Atualiza o conteúdo de uma seção no banco e recarrega o estado.
   */
  salvarSecao(secao: string, conteudo: { chave: string, valor: string }[]): Observable<any> {
    const body: Record<string, string> = {};
    conteudo.forEach(c => body[c.chave] = c.valor);
    // Sem tap de refresh — o componente faz o refresh após a UI atualizar
    return this.http.patch(`${this.apiUrl}/site-config/secoes/${secao}`, body);
  }

  // ──────────────────────────────────────────────────────────
  // UTILIDADES
  // ──────────────────────────────────────────────────────────

  /**
   * Aplica a cor primária diretamente nas variáveis CSS do Root.
   */
  public aplicarCorPrimaria(corHex?: string): void {
    if (!corHex) return;
    const rootElement = this.document?.documentElement;
    if (!rootElement) return;

    rootElement.style.setProperty('--color-primary', corHex);
    rootElement.style.setProperty('--color-primary-dark', this.escurecerCorHex(corHex, 20));
  }

  private escurecerCorHex(hex: string, amount: number): string {
    const color = this.normalizarHex(hex);
    if (!color) return hex;

    const num = parseInt(color, 16);
    const r = this.limitarCanal(((num >> 16) & 0xff) - amount);
    const g = this.limitarCanal(((num >> 8) & 0xff) - amount);
    const b = this.limitarCanal((num & 0xff) - amount);

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  private normalizarHex(hex: string): string | null {
    let color = hex.trim().replace('#', '');
    if (color.length === 3) {
      color = color.split('').map(c => c + c).join('');
    }

    return /^[0-9a-fA-F]{6}$/.test(color) ? color : null;
  }

  private limitarCanal(valor: number): number {
    return Math.max(Math.min(255, valor), 0);
  }
}
