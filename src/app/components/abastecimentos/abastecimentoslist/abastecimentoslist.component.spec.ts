import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbastecimentoListComponent } from './abastecimentoslist.component';

describe('AbastecimentoslistComponent', () => {
  let component: AbastecimentoListComponent;
  let fixture: ComponentFixture<AbastecimentoListComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbastecimentoListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbastecimentoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
