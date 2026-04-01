import { 
  Component, 
  ChangeDetectionStrategy, 
  Input, 
  Output, 
  EventEmitter, 
  inject, 
  signal,
  DestroyRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UsuariosService, Usuario } from '../../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-usuario-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule],
  templateUrl: './usuario-form-modal.component.html',
  styleUrl: './usuario-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly usuariosService = inject(UsuariosService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('dialogForm') dialogRef!: ElementRef<HTMLDialogElement>;

  @Input() set usuarioEdicao(u: Usuario | null) {
    this._usuarioEdicao = u;
    if (u) {
      this.iniciarFormulario(u);
      this.abrirModal();
    } else {
      this.fecharModal(false);
    }
  }
  get usuarioEdicao(): Usuario | null { return this._usuarioEdicao; }
  private _usuarioEdicao: Usuario | null = null;

  @Output() fechar = new EventEmitter<void>();
  @Output() tentarFecharSujo = new EventEmitter<boolean>();
  @Output() salvar = new EventEmitter<any>();

  editForm!: FormGroup;
  readonly salvando = signal(false);
  
  cpfStatus = signal<'livre' | 'ativo' | 'inativo' | 'verificando' | 'excluido' | ''>('');
  cpfConflito = signal<{ nome: string; matricula: string | null } | null>(null);

  readonly roles = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'SECRETARIA', label: 'Secretaria' },
    { value: 'PROFESSOR', label: 'Professor' },
    { value: 'COMUNICACAO', label: 'Comunicação' }
  ];

  constructor() {
    this.editForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, Validators.minLength(14)]],
      email: ['', [Validators.email]],
      role: ['', Validators.required],
      telefone: [''],
      cep: [''],
      rua: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      uf: ['', [Validators.maxLength(2)]],
    });
  }

  iniciarFormulario(u: Usuario): void {
    const telFormated = u.telefone
        ? u.telefone.replace(/\D/g, '').length <= 10
            ? u.telefone.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
            : u.telefone.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
        : '';

    this.editForm.patchValue({
        nome: u.nome,
        cpf: u.cpf ? u.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '',
        email: u.email ?? '',
        role: u.role,
        telefone: telFormated,
        cep: u.cep ?? '',
        rua: u.rua ?? '',
        numero: u.numero ?? '',
        complemento: u.complemento ?? '',
        bairro: u.bairro ?? '',
        cidade: u.cidade ?? '',
        uf: u.uf ?? '',
    });
    this.cpfStatus.set('livre');
    this.cpfConflito.set(null);
  }

  abrirModal(): void {
    const d = this.dialogRef?.nativeElement;
    if (d && !d.open) {
      d.showModal();
    }
  }

  fecharModal(emit = true): void {
    const d = this.dialogRef?.nativeElement;
    if (d && d.open) {
      d.close();
    }
    if (emit) {
      this.fechar.emit();
    }
  }

  onCancelBtn(): void {
    if (this.editForm.dirty && !this.salvando()) {
       this.tentarFecharSujo.emit(true);
    } else {
       this.fecharModal();
    }
  }

  formatarCpf(event: any) {
    let v = event.target.value.replace(/\D/g, '').substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    event.target.value = v;
    this.editForm.get('cpf')?.setValue(v, { emitEvent: false });
    
    if (this.cpfStatus() !== '' && this.cpfStatus() !== 'livre') {
        this.cpfStatus.set('');
        this.cpfConflito.set(null);
    }
  }

  formatarTelefone(event: any) {
    let v = event.target.value.replace(/\D/g, '').substring(0, 11);
    v = v.length <= 10
        ? v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
        : v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    event.target.value = v;
    this.editForm.get('telefone')?.setValue(v, { emitEvent: false });
  }

  verificarCpfBlur() {
    const valor = this.editForm.get('cpf')?.value ?? '';
    const limpo = valor.replace(/\D/g, '');

    if (!limpo || limpo.length !== 11) {
        this.cpfStatus.set('');
        this.cpfConflito.set(null);
        return;
    }

    if (this._usuarioEdicao?.cpf === limpo) {
        this.cpfStatus.set('livre');
        this.cpfConflito.set(null);
        return;
    }

    this.cpfStatus.set('verificando');
    this.cpfConflito.set(null);

    this.usuariosService.verificarCpf(limpo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
            if (res.status === 'livre' || res.id === this._usuarioEdicao?.id) {
                this.cpfStatus.set('livre');
            } else {
                this.cpfStatus.set(res.status as any);
                this.cpfConflito.set({ nome: res.nome, matricula: res.matricula });
            }
        },
        error: () => this.cpfStatus.set('')
      });
  }

  buscarCep(): void {
    let cep = this.editForm.get('cep')?.value;
    if (!cep) return;
    cep = cep.replace(/\D/g, '');
    if (cep.length === 8) {
        this.liveAnnouncer.announce('Buscando endereço pelo CEP...');
        this.http.get(`https://viacep.com.br/ws/${cep}/json/`)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (dados: any) => {
                if (dados.erro) {
                    this.toast.erro('CEP não encontrado.');
                    this.liveAnnouncer.announce('CEP não encontrado. Verifique a digitação.');
                } else {
                    this.editForm.patchValue({
                        rua: dados.logradouro,
                        bairro: dados.bairro,
                        cidade: dados.localidade,
                        uf: dados.uf
                    });
                    this.liveAnnouncer.announce('Endereço preenchido automaticamente.');
                }
            },
            error: () => {
                this.toast.erro('Erro ao buscar o CEP.');
                this.liveAnnouncer.announce('Erro ao conectar com o serviço de CEP.');
            }
        });
    }
  }

  onSaveForm(): void {
    const cpfLimpo = this.editForm.get('cpf')?.value?.replace(/\D/g, '');
    const st = this.cpfStatus();
    
    if (this.editForm.invalid || !this._usuarioEdicao || (st && st !== 'livre' && cpfLimpo !== this._usuarioEdicao.cpf)) {
        this.editForm.markAllAsTouched();
        return;
    }
    
    this.salvando.set(true);
    const rawVal = this.editForm.value;
    const payload = {
        ...rawVal,
        telefone: rawVal.telefone ? rawVal.telefone.replace(/\D/g, '') : rawVal.telefone,
        cep: rawVal.cep ? rawVal.cep.replace(/\D/g, '') : rawVal.cep
    };

    this.usuariosService.atualizar(this._usuarioEdicao.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
            this.salvando.set(false);
            this.fecharModal(true);
            this.toast.sucesso('Usuário editado com sucesso!');
            this.salvar.emit(payload); // Recarrega parent list
        },
        error: (err) => {
            this.salvando.set(false);
            const msg = err.error?.message || 'Erro ao editar usuário.';
            this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
        }
    });
  }
}
