import { TestBed } from '@angular/core/testing';

import { RelatorioServiceService } from './relatorio-service.service';

describe('RelatorioServiceService', () => {
  let service: RelatorioServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelatorioServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
