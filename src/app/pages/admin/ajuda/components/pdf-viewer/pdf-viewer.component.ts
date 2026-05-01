import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { SafeUrlPipe } from '../../../../../core/pipes/safe-url.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent implements AfterViewInit {
  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) src!: string;
  @Output() close = new EventEmitter<void>();

  @ViewChild('closeBtn') closeBtn!: ElementRef<HTMLButtonElement>;

  ngAfterViewInit(): void {
    // Focus dinâmico para Acessibilidade (WCAG 2.1 AA)
    setTimeout(() => {
      this.closeBtn?.nativeElement?.focus();
    }, 100);
  }

  onClose(): void {
    this.close.emit();
  }
}
