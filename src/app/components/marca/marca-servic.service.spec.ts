import { TestBed } from '@angular/core/testing';

import { MarcaServicService } from './marca-servic.service';

describe('MarcaServicService', () => {
  let service: MarcaServicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarcaServicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
