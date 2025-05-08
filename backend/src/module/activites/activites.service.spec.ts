import { Test, TestingModule } from '@nestjs/testing';
import { ActivitesService } from './activites.service';

describe('ActivitesService', () => {
  let service: ActivitesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivitesService],
    }).compile();

    service = module.get<ActivitesService>(ActivitesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
