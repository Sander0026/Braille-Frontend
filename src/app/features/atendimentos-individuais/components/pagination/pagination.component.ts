import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() lastPage = 1;
  @Input() total = 0;
  @Input() loading = false;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();

  get normalizedLastPage(): number {
    return Math.max(1, this.lastPage || 1);
  }

  get normalizedPage(): number {
    return Math.min(Math.max(1, this.page || 1), this.normalizedLastPage);
  }

  goPrevious(): void {
    if (this.loading || this.normalizedPage <= 1) return;
    const target = this.normalizedPage - 1;
    this.previous.emit();
    this.pageChange.emit(target);
  }

  goNext(): void {
    if (this.loading || this.normalizedPage >= this.normalizedLastPage) return;
    const target = this.normalizedPage + 1;
    this.next.emit();
    this.pageChange.emit(target);
  }
}
