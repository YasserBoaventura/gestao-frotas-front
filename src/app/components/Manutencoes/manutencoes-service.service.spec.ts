import { TestBed } from '@angular/core/testing';

import { ManutencoesServiceService } from './manutencoes-service.service';

describe('ManutencoesServiceService', () => {
  let service: ManutencoesServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManutencoesServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
