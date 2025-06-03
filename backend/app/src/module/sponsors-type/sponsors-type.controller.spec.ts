import { Test, TestingModule } from '@nestjs/testing';
import { SponsorsTypeController } from './sponsors-type.controller';
import { SponsorsTypeService } from './sponsors-type.service';

describe('SponsorsTypeController', () => {
  let controller: SponsorsTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SponsorsTypeController],
      providers: [SponsorsTypeService],
    }).compile();

    controller = module.get<SponsorsTypeController>(SponsorsTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
