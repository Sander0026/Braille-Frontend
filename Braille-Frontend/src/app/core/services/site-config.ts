import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SiteConfigMap {
  [chave: string]: string;
}

export interface SecaoMap {
  [chave: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class SiteConfigService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Estado global reativo das configurações (para a cor primária, logo, etc)
  private configsSubject = new BehaviorSubject<SiteConfigMap>({});
  public configs$ = this.configsSubject.asObservable();

  constructor() { }

  /**
   * Busca todas as configurações gerais do site e atualiza o estado interno.
   * Chamado no inicializador do App ou AppComponent.
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
   * Pega o valor atual síncrono de uma configuração específica (ex: 'logo').
   */
  getConfig(chave: string): string | undefined {
    return this.configsSubject.value[chave];
  }

  /**
   * Busca o conteúdo de uma seção específica da home.
   */
  getSecao(secao: string): Observable<SecaoMap> {
    return this.http.get<SecaoMap>(`${this.apiUrl}/site-config/secoes/${secao}`);
  }

  /**
   * Atualiza as configurações no banco (Uso exclusivo do ADMIN)
   */
  salvarConfigs(configs: { chave: string, valor: string }[]): Observable<any> {
    return this.http.patch(`${this.apiUrl}/site-config`, { configs }).pipe(
      tap(() => this.carregarConfigs().subscribe()) // Secundariza a recarga
    );
  }

  /**
   * Atualiza o conteúdo de uma seção no banco (Uso exclusivo do ADMIN)
   */
  salvarSecao(secao: string, conteudo: { chave: string, valor: string }[]): Observable<any> {
    return this.http.patch(`${this.apiUrl}/site-config/secoes`, { secao, conteudo });
  }

  /**
   * Aplica a cor definida no banco diretamente nas variáveis CSS do Root (HTML).
   */
  public aplicarCorPrimaria(corHex?: string) {
    if (!corHex) return;

    // Seta a cor primária global
    document.documentElement.style.setProperty('--color-primary', corHex);

    // Função simples auxiliar pra escurecer o hex em ~10% para o hover dos botões
    const darkenHex = (hex: string, amount: number) => {
      let color = hex.replace('#', '');
      if (color.length === 3) color = color.split('').map(c => c + c).join('');
      let num = parseInt(color, 16);
      let r = (num >> 16) - amount;
      let b = ((num >> 8) & 0x00FF) - amount;
      let g = (num & 0x0000FF) - amount;
      r = Math.max(Math.min(255, r), 0);
      b = Math.max(Math.min(255, b), 0);
      g = Math.max(Math.min(255, g), 0);
      return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
    };

    document.documentElement.style.setProperty('--color-primary-dark', darkenHex(corHex, 20));
  }
}
