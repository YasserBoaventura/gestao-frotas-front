import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeiculosdetalisComponent } from './veiculosdetalis.component';

describe('VeiculosdetalisComponent', () => {
  let component: VeiculosdetalisComponent;
  let fixture: ComponentFixture<VeiculosdetalisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeiculosdetalisComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VeiculosdetalisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
