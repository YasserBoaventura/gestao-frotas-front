import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotoristalistComponent } from './motoristalist.component';

describe('MotoristalistComponent', () => {
  let component: MotoristalistComponent;
  let fixture: ComponentFixture<MotoristalistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotoristalistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MotoristalistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
