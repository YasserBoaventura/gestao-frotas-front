import { TestBed } from '@angular/core/testing';

import { ViagensServiceService } from './viagens-service.service';

describe('ViagensServiceService', () => {
  let service: ViagensServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViagensServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
