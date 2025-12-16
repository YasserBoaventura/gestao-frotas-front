import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioviagemComponent } from './relatorioviagem.component';

describe('RelatorioviagemComponent', () => {
  let component: RelatorioviagemComponent;
  let fixture: ComponentFixture<RelatorioviagemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioviagemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RelatorioviagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
