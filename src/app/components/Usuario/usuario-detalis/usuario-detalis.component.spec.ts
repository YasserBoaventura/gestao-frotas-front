import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioDetalisComponent } from './usuario-detalis.component';

describe('UsuarioDetalisComponent', () => {
  let component: UsuarioDetalisComponent;
  let fixture: ComponentFixture<UsuarioDetalisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioDetalisComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UsuarioDetalisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
