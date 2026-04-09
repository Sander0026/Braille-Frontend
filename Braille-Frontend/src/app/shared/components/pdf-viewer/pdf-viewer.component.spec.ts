import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfViewerComponent } from './pdf-viewer.component';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe';
import { ComponentRef } from '@angular/core';

describe('PdfViewerComponent', () => {
  let component: PdfViewerComponent;
  let fixture: ComponentFixture<PdfViewerComponent>;
  let componentRef: ComponentRef<PdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfViewerComponent, SafeUrlPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfViewerComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    
    // Configura o Signal Input obrigatorio
    componentRef.setInput('url', 'blob:http://localhost:4200/5e01df3f');
    fixture.detectChanges();
  });

  it('deve criar o componente corretamente', () => {
    expect(component).toBeTruthy();
  });

  it('deve renderizar a URL nativamente (sem passar pelo Google Docs Viewer)', () => {
    const renderUrl = component.urlVisualizadorPdf();
    expect(renderUrl).not.toContain('docs.google.com');
    expect(renderUrl).toBe('blob:http://localhost:4200/5e01df3f');
  });

  it('deve emitir o evento fecharModal ao acionar onClose()', () => {
    spyOn(component.fecharModal, 'emit');
    component.onClose();
    expect(component.fecharModal.emit).toHaveBeenCalled();
  });
});
