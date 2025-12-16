import { TestBed } from '@angular/core/testing';

import { RotasServiceService } from './rotas-service.service';

describe('RotasServiceService', () => {
  let service: RotasServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RotasServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
