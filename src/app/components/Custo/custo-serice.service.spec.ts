import { TestBed } from '@angular/core/testing';

import { CustoSericeService } from './custo-serice.service';

describe('CustoSericeService', () => {
  let service: CustoSericeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustoSericeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
