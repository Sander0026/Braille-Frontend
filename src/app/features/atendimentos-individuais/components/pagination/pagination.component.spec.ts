import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let component: PaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('deve emitir previous e pageChange ao voltar pagina', () => {
    const previousSpy = vi.spyOn(component.previous, 'emit');
    const pageChangeSpy = vi.spyOn(component.pageChange, 'emit');
    component.page = 2;
    component.lastPage = 3;

    component.goPrevious();

    expect(previousSpy).toHaveBeenCalled();
    expect(pageChangeSpy).toHaveBeenCalledWith(1);
  });

  it('deve emitir next e pageChange ao avancar pagina', () => {
    const nextSpy = vi.spyOn(component.next, 'emit');
    const pageChangeSpy = vi.spyOn(component.pageChange, 'emit');
    component.page = 1;
    component.lastPage = 3;

    component.goNext();

    expect(nextSpy).toHaveBeenCalled();
    expect(pageChangeSpy).toHaveBeenCalledWith(2);
  });

  it('nao deve emitir quando estiver carregando', () => {
    const nextSpy = vi.spyOn(component.next, 'emit');
    component.page = 1;
    component.lastPage = 3;
    component.loading = true;

    component.goNext();

    expect(nextSpy).not.toHaveBeenCalled();
  });
});
