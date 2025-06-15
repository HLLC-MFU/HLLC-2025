import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesTypeService } from './activities-type.service';

describe('ActivitiesTypeService', () => {
  let service: ActivitiesTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivitiesTypeService],
    }).compile();

    service = module.get<ActivitiesTypeService>(ActivitiesTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
