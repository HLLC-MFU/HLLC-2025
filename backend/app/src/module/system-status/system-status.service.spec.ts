import { Test, TestingModule } from '@nestjs/testing';
import { SystemStatusService } from './system-status.service';

describe('SystemStatusService', () => {
  let service: SystemStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemStatusService],
    }).compile();

    service = module.get<SystemStatusService>(SystemStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
