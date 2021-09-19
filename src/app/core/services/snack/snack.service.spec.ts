import { TestBed } from '@angular/core/testing';

import { SnackService } from './snack.service';

describe('SnackService', () => {
  let service: SnackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
