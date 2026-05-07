import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLinkActive } from '@angular/router';

export interface RotaSidebar {
  rota: string;
  label: string;
  icon: string;
  aria: string;
  role?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() sidebarState: 'full' | 'icons' | 'hidden' = 'full';
  @Input() showLabels: boolean = true;
  @Input() rotasPermitidas: RotaSidebar[] = [];
  
  @Output() readonly action = new EventEmitter<'sair'>();

  constructor(private readonly router: Router) {}

  navegar(rota: string, event?: Event): void {
    event?.preventDefault();
    if (this.sidebarState === 'hidden') return;
    this.router.navigateByUrl(rota);
  }

  emitAction(actionName: 'sair') {
    this.action.emit(actionName);
  }
}
