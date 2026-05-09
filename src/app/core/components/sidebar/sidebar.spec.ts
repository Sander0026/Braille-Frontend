import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn>; url: string };

  beforeEach(async () => {
    routerMock = {
      navigateByUrl: vi.fn(),
      url: '/admin/dashboard',
    };

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        { provide: Router, useValue: routerMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navega para a rota do item selecionado', () => {
    component.navegar('/admin/modelos-certificados');

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/admin/modelos-certificados');
  });

  it('marca a rota atual como ativa', () => {
    routerMock.url = '/admin/modelos-certificados';

    expect(component.isActive('/admin/modelos-certificados')).toBe(true);
  });
});
