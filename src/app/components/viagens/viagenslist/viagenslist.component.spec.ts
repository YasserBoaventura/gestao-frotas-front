import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViagenslistComponent } from './viagenslist.component';

describe('ViagenslistComponent', () => {
  let component: ViagenslistComponent;
  let fixture: ComponentFixture<ViagenslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViagenslistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViagenslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
