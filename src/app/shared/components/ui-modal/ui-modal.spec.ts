import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';

import { UiModal } from './ui-modal';

describe('UiModal', () => {
  let component: UiModal;
  let fixture: ComponentFixture<UiModal>;
  let componentRef: ComponentRef<UiModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UiModal);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    
    // Configura o input obrigatorio para Signal Inputs
    componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
