import { Test, TestingModule } from '@nestjs/testing';
import { SystemStatusController } from './system-status.controller';
import { SystemStatusService } from './system-status.service';

describe('SystemStatusController', () => {
  let controller: SystemStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemStatusController],
      providers: [SystemStatusService],
    }).compile();

    controller = module.get<SystemStatusController>(SystemStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
