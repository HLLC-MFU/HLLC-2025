import { Test, TestingModule } from '@nestjs/testing';
import { ActivitesController } from './activites.controller';
import { ActivitesService } from './activites.service';

describe('ActivitesController', () => {
  let controller: ActivitesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitesController],
      providers: [ActivitesService],
    }).compile();

    controller = module.get<ActivitesController>(ActivitesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
