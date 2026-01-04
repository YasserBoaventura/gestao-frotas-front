import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioCombustivelComponent } from './relatorio-combustivel.component';

describe('RelatorioCombustivelComponent', () => {
  let component: RelatorioCombustivelComponent;
  let fixture: ComponentFixture<RelatorioCombustivelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioCombustivelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RelatorioCombustivelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
