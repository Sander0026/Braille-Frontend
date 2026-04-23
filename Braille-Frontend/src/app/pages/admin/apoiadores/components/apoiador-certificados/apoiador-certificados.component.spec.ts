import { TestBed } from '@angular/core/testing';
import { ApoiadorCertificadosComponent } from './apoiador-certificados.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApoiadoresService } from '../../apoiadores.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';

describe('ApoiadorCertificadosComponent (SecDevOps Test)', () => {
  let component: ApoiadorCertificadosComponent;
  let apoiadoresServiceMock: any;

  beforeEach(() => {
    apoiadoresServiceMock = {
      gerarPdfCertificado: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ApoiadorCertificadosComponent],
      providers: [
        FormBuilder,
        { provide: ApoiadoresService, useValue: apoiadoresServiceMock },
        { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } }
      ]
    });
    
    // Polyfill para URL nativo no mock do JS DOM
    if (typeof URL.createObjectURL === 'undefined') {
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = vi.fn();
    }

    const fixture = TestBed.createComponent(ApoiadorCertificadosComponent);
    component = fixture.componentInstance;
    component.apoiador = { id: '123', nomeRazaoSocial: 'Mock Corp' } as any;
  });

  it('deve buscar o blob PDF seguro pelo backend e abri-lo (abrirPdf)', () => {
    const mockBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    apoiadoresServiceMock.gerarPdfCertificado.mockReturnValue(of(mockBlob));

    const certMock = { id: 'abc-123', tituloCertificado: 'Honra ao Mérito' };
    
    expect(component.processandoId).toBeNull();
    component.abrirPdf(certMock);

    expect(apoiadoresServiceMock.gerarPdfCertificado).toHaveBeenCalledWith('123', 'abc-123');
    expect(component.pdfAberto).toBe(true);
    expect(component.pdfAtual?.title).toContain('Honra ao Mérito');
    expect(component.processandoId).toBeNull(); // Loading finalizado
  });

  it('deve lidar com erro ao visualizar PDF, resetando UI', () => {
    apoiadoresServiceMock.gerarPdfCertificado.mockReturnValue(throwError(() => new Error('Server limit')));
    
    const certMock = { id: 'abc-123' };
    component.abrirPdf(certMock);

    expect(component.pdfAberto).toBe(false);
    expect(component.processandoId).toBeNull();
  });

  it('deve buscar o blob, criar o link e revoga-lo da memória ao baixar (baixarPdf)', () => {
    const mockBlob = new Blob(['pdf virtual bin'], { type: 'application/pdf' });
    apoiadoresServiceMock.gerarPdfCertificado.mockReturnValue(of(mockBlob));

    const certMock = { id: 'xyz', dataEmissao: '2026-03-24T10:00:00Z' };

    // Mock do createElement e click pra blindar teste de DOM
    const linkMock = { href: '', download: '', target: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(linkMock as any);

    component.baixarPdf(certMock);

    expect(linkMock.click).toHaveBeenCalled();
    expect(linkMock.download).toBe('Certificado_123_2026-03-24.pdf');
    expect(URL.revokeObjectURL).toHaveBeenCalled(); // Verifica GC / Memory leak prevention
  });
});
