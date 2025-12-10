import { TestBed } from '@angular/core/testing';

import { AbstecimeserviceService } from './abstecimeservice.service';

describe('AbstecimeserviceService', () => {
  let service: AbstecimeserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AbstecimeserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
