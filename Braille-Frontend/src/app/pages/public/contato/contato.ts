import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SiteConfigService } from '../../../core/services/site-config';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TabEscapeDirective } from '../../../shared/directives/tab-escape.directive';

interface ContatoPayload {
    nome: string;
    email: string;
    telefone: string;
    assunto: string;
    mensagem: string;
}

@Component({
    selector: 'app-contato',
    standalone: true,
    imports: [CommonModule, FormsModule, TabEscapeDirective, CloudinaryPipe],
    templateUrl: './contato.html',
    styleUrl: './contato.scss',
})
export class Contato implements OnInit {

    form: ContatoPayload = {
        nome: '',
        email: '',
        telefone: '',
        assunto: '',
        mensagem: '',
    };

    enviando = false;
    enviado = false;
    erroEnvio = '';
    fachadaUrl: string = '';

    // Campos tocados (para validação visual)
    tocado: Record<string, boolean> = {};

    // Dados Dinâmicos do CMS (Aba Contato)
    contatoConfig$: Observable<any>;

    constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private siteConfig: SiteConfigService) {
        this.contatoConfig$ = this.siteConfig.secoes$.pipe(
            map(secoes => secoes['contato_global'] || {})
        );
    }

    ngOnInit() {
        // Carregar fachadaUrl
        this.siteConfig.configs$.subscribe({
            next: (configs) => {
                if (configs && configs['fachadaUrl']) {
                    this.fachadaUrl = configs['fachadaUrl'];
                }
            }
        });
    }

    marcarTocado(campo: string): void {
        this.tocado[campo] = true;
    }

    private readonly regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    get formValido(): boolean {
        const emailPreenchido = this.form.email.trim();
        const emailValido = !emailPreenchido || this.regexEmail.test(emailPreenchido);
        const contatoInformado = !!(emailPreenchido || this.form.telefone.trim());

        return !!(
            this.form.nome.trim().length >= 2 &&
            this.form.assunto.trim().length >= 3 &&
            this.form.mensagem.trim().length >= 10 &&
            contatoInformado &&
            emailValido
        );
    }

    // ── Máscara de telefone ─────────────────────────────────
    aplicarMascaraTelefone(event: Event): void {
        const input = event.target as HTMLInputElement;
        // Remove tudo que não for dígito
        let digits = input.value.replace(/\D/g, '').slice(0, 11);

        // Formata: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
        if (digits.length > 10) {
            digits = digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (digits.length > 6) {
            digits = digits.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
        } else if (digits.length > 2) {
            digits = digits.replace(/(\d{2})(\d+)/, '($1) $2');
        }

        this.form.telefone = digits;
        input.value = digits; // atualiza o DOM imediatamente
    }

    isCampoInvalido(campo: keyof ContatoPayload): boolean {
        if (!this.tocado[campo]) return false;

        switch (campo) {
            case 'nome':
                return this.form.nome.trim().length < 2;
            case 'assunto':
                return this.form.assunto.trim().length < 3;
            case 'mensagem':
                return this.form.mensagem.trim().length < 10;
            case 'email': {
                const v = this.form.email.trim();
                // Inválido se: nenhum contato informado OU e-mail preenchido com formato errado
                if (!v && !this.form.telefone.trim()) return true;  // nenhum contato
                if (v && !this.regexEmail.test(v)) return true;    // formato inválido
                return false;
            }
            default:
                return false;
        }
    }

    enviar(): void {
        // Marca todos como tocados para mostrar erros
        ['nome', 'email', 'assunto', 'mensagem'].forEach(c => (this.tocado[c] = true));

        if (!this.formValido || this.enviando) return;

        this.enviando = true;
        this.erroEnvio = '';

        // Monta payload removendo campos vazios
        const payload: Record<string, string> = {
            nome: this.form.nome.trim(),
            assunto: this.form.assunto.trim(),
            mensagem: this.form.mensagem.trim(),
        };
        if (this.form.email.trim()) payload['email'] = this.form.email.trim();
        if (this.form.telefone.trim()) payload['telefone'] = this.form.telefone.trim();

        this.http.post('/api/contatos', payload).subscribe({
            next: () => {
                this.enviando = false;
                this.enviado = true;
                this.cdr.detectChanges();
            },
            error: () => {
                this.enviando = false;
                this.erroEnvio = 'Não foi possível enviar a mensagem. Tente novamente em instantes.';
                this.cdr.detectChanges();
            },
        });
    }

    novoContato(): void {
        this.enviado = false;
        this.erroEnvio = '';
        this.tocado = {};
        this.form = { nome: '', email: '', telefone: '', assunto: '', mensagem: '' };
    }
}
