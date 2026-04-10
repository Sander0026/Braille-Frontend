import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apoiador, AcaoApoiador, ApoiadoresService } from '../../apoiadores.service';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-apoiador-acoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule],
  templateUrl: './apoiador-acoes.component.html',
  styleUrl: './apoiador-acoes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApoiadorAcoesComponent implements OnInit {
  @Input({ required: true }) isOpen = false;
  @Input({ required: true }) apoiador!: Apoiador;
  @Input() acoes: AcaoApoiador[] = [];
  @Input() carregandoAcoes = false;

  @Output() modalClosed = new EventEmitter<void>();
  @Output() actionsUpdated = new EventEmitter<void>();

  acaoForm!: FormGroup;
  salvandoAcao = false;

  private readonly announcer = inject(LiveAnnouncer);

  constructor(
    private readonly fb: FormBuilder,
    private readonly apoiadoresService: ApoiadoresService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.acaoForm = this.fb.group({
      dataEvento: ['', Validators.required],
      descricaoAcao: ['', Validators.required],
      valorEnvolvido: [null]
    });
  }

  fecharModal(): void {
    this.acaoForm.reset();
    this.modalClosed.emit();
  }

  adicionarAcao(): void {
    if (this.acaoForm.invalid || !this.apoiador) {
      this.acaoForm.markAllAsTouched();
      return;
    }

    this.salvandoAcao = true;
    const dto = this.acaoForm.value;

    this.apoiadoresService.adicionarAcao(this.apoiador.id, dto).subscribe({
      next: () => {
        this.salvandoAcao = false;
        this.announcer.announce('Nova interação registrada com sucesso.', 'polite');
        this.acaoForm.reset();
        this.actionsUpdated.emit();
      },
      error: (err: any) => {
        console.error('Erro ao adicionar acao', err);
        this.announcer.announce('Falha ao registrar ação. Verifique a conexão.', 'assertive');
        this.salvandoAcao = false;
        this.cdr.detectChanges();
      }
    });
  }

  removerAcao(acaoId: string): void {
    if (!this.apoiador || !confirm('Deseja realmente excluir este registro histórico?')) return;

    this.carregandoAcoes = true;
    this.cdr.detectChanges(); // forces UI update to show loader
    
    this.apoiadoresService.removerAcao(this.apoiador.id, acaoId).subscribe({
      next: () => {
        this.announcer.announce('Interação removida do histórico.', 'polite');
        this.actionsUpdated.emit();
      },
      error: (err: any) => {
        console.error('Erro ao remover acao', err);
        this.announcer.announce('Falha ao remover a ação via servidor.', 'assertive');
        this.carregandoAcoes = false;
        this.cdr.detectChanges();
      }
    });
  }
}
