import { Component, ElementRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabelaTrFocavelDirective } from './tabela-tr-focavel.directive';

@Component({
  template: `<tr appTabelaTrFocavel #trDir="read"></tr>`,
  standalone: true,
  imports: [TabelaTrFocavelDirective]
})
class TestComponent {
  @ViewChild(TabelaTrFocavelDirective) directive!: TabelaTrFocavelDirective;
  @ViewChild('trDir', { read: ElementRef }) elementRef!: ElementRef;
}

describe('TabelaTrFocavelDirective (SecDevOps Test)', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent, TabelaTrFocavelDirective]
    });
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve focar o elemento injetado atomicamente', () => {
    const focusSpy = vi.spyOn(component.elementRef.nativeElement, 'focus');
    component.directive.focus();
    expect(focusSpy).toHaveBeenCalled();
  });
});
