import { TestBed } from '@angular/core/testing';

import { TrocarSenhaServiceService } from './trocar-senha-service.service';

describe('TrocarSenhaServiceService', () => {
  let service: TrocarSenhaServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrocarSenhaServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
