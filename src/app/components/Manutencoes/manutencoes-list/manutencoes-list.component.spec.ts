import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManutencoesListComponent } from './manutencoes-list.component';

describe('ManutencoesListComponent', () => {
  let component: ManutencoesListComponent;
  let fixture: ComponentFixture<ManutencoesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManutencoesListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManutencoesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
