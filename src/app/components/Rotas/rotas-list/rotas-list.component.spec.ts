import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotasListComponent } from './rotas-list.component';

describe('RotasListComponent', () => {
  let component: RotasListComponent;
  let fixture: ComponentFixture<RotasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotasListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RotasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
