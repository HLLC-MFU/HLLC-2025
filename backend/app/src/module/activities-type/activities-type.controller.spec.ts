import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesTypeController } from './activities-type.controller';
import { ActivitiesTypeService } from './activities-type.service';

describe('ActivitiesTypeController', () => {
  let controller: ActivitiesTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesTypeController],
      providers: [ActivitiesTypeService],
    }).compile();

    controller = module.get<ActivitiesTypeController>(ActivitiesTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
