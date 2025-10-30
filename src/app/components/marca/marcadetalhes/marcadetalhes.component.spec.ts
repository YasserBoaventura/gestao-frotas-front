import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcadetalhesComponent } from './marcadetalhes.component';

describe('MarcadetalhesComponent', () => {
  let component: MarcadetalhesComponent;
  let fixture: ComponentFixture<MarcadetalhesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcadetalhesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MarcadetalhesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
