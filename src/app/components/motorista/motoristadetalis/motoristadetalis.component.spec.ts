import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotoristadetalisComponent } from './motoristadetalis.component';

describe('MotoristadetalisComponent', () => {
  let component: MotoristadetalisComponent;
  let fixture: ComponentFixture<MotoristadetalisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotoristadetalisComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MotoristadetalisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
