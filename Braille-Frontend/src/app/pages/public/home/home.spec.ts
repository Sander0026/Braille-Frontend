import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SiteConfigService } from '../../../core/services/site-config';
import { ApoiadoresService } from '../../admin/apoiadores/apoiadores.service';
import { of } from 'rxjs';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { 
          provide: SiteConfigService, 
          useValue: { 
            getSecao: vi.fn().mockReturnValue(of({})),
            configs$: of({})
          } 
        },
        { 
          provide: ApoiadoresService, 
          useValue: { buscarPublicos: vi.fn().mockReturnValue(of([])) } 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
