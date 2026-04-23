import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-conteudo-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule],
  templateUrl: './conteudo-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConteudoConfigComponent implements OnInit {
  formConfig: FormGroup;
  
  salvando = signal(false);
  uploadandoFachada = signal(false);
  
  fachadaPreview = signal<string | null>(null);
  fachadaParaExcluir = signal(false);
  
  private lastFocusBeforeModal: HTMLElement | null = null;
  private fileSelecionado: File | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly siteConfig = inject(SiteConfigService);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly announcer = inject(LiveAnnouncer);

  constructor() {
    this.formConfig = this.fb.group({
      fachadaUrl: [''],
    });
  }

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.siteConfig.configs$.pipe(
      filter(c => Object.keys(c).length > 0),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(configs => {
      const fachadaUrl = configs['fachadaUrl'] || '';
      
      this.formConfig.patchValue({ fachadaUrl });
      
      if (fachadaUrl) {
        this.fachadaPreview.set(fachadaUrl);
      }
    });
  }

  async onFachadaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.toast.erro('A imagem deve ter no máximo 2MB');
        this.announcer.announce('Erro: O arquivo selecionado ultrapassa o limite de 2 megabytes.', 'assertive');
        return;
      }
      this.fileSelecionado = file;
      this.uploadandoFachada.set(true);

      const token = localStorage.getItem('token') || '';
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const fd = new FormData();
      fd.append('file', file);

      try {
        const res = await firstValueFrom(this.http.post<{ url: string }>(`/api/upload`, fd, { headers }));
        this.fachadaPreview.set(res.url);
        this.formConfig.patchValue({ fachadaUrl: res.url });
        this.toast.sucesso('Upload realizado. Clique em "Salvar Configurações" para confirmar.');
        this.announcer.announce('Upload processado com sucesso. Salve as configurações do site para efetivar o fundo.', 'polite');
      } catch (err) {
        this.toast.erro('Erro ao fazer upload da fachada.');
        this.announcer.announce('Houve um erro no navegador ao enviar a imagem. Tente outro arquivo.', 'assertive');
      } finally {
        this.uploadandoFachada.set(false);
      }
    }
  }

  removerFachada() {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.fachadaParaExcluir.set(true);
  }

  cancelarExclusaoFachada() {
    this.fachadaParaExcluir.set(false);
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }

  confirmarExclusaoFachada() {
    this.fileSelecionado = null;
    this.fachadaPreview.set(null);
    this.formConfig.patchValue({ fachadaUrl: '' });
    this.toast.sucesso('Foto removida. Em seguida, Salve as Configurações.');
    this.announcer.announce('A foto foi removida do preview. Pressione "Salvar Configurações" para confirmar.', 'polite');
    this.cancelarExclusaoFachada();
  }

  salvarConfig() {
    // Retenho compatibilidade, form tem validacao nula mas deixo
    if (this.formConfig.invalid) return;

    this.salvando.set(true);
    const values = this.formConfig.value;
    
    // Converte pra formato SiteConfig { chave, valor }
    const arraySalvar = Object.keys(values).map(k => ({ chave: k, valor: String(values[k] || '') }));

    this.siteConfig.salvarConfigs(arraySalvar).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Configurações salvas com sucesso!');
        this.announcer.announce('Suas configurações de site foram aplicadas instantaneamente.', 'polite');
        this.siteConfig.carregarConfigs().pipe(take(1)).subscribe();
      },
      error: () => { 
        this.salvando.set(false);
        this.toast.erro('Erro ao salvar as configurações.');
        this.announcer.announce('Erro no servidor ao tentar processar as configurações.', 'assertive');
      }
    });
  }
}
