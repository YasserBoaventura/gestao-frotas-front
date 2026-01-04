import { TestBed } from '@angular/core/testing';

import { RelatorioCombustivelService } from './relatorio-combustivel.service';

describe('RelatorioCombustivelService', () => {
  let service: RelatorioCombustivelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelatorioCombustivelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
