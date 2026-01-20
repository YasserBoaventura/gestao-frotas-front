import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioManutencaoComponent } from './relatorio-manutencao.component';

describe('RelatorioManutencaoComponent', () => {
  let component: RelatorioManutencaoComponent;
  let fixture: ComponentFixture<RelatorioManutencaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioManutencaoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RelatorioManutencaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
