import { TestBed } from '@angular/core/testing';

import { MapaService } from './mapa.service';

describe('MapaService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MapaService = TestBed.get(MapaService);
    expect(service).toBeTruthy();
  });
});
