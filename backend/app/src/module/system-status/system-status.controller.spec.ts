import { Test, TestingModule } from '@nestjs/testing';
import { SystemStatusController } from './system-status.controller';
import { SystemStatusService } from './system-status.service';
import { CreateSystemStatusDto } from './dto/create-system-status.dto';
import { UpdateSystemStatusDto } from './dto/update-system-status.dto';

describe('SystemStatusController', () => {
  let controller: SystemStatusController;
  let service: SystemStatusService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemStatusController],
      providers: [
        {
          provide: SystemStatusService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SystemStatusController>(SystemStatusController);
    service = module.get<SystemStatusService>(SystemStatusService);
  });

  describe('create()', () => {
    it('should call service.create with correct DTO', async () => {
      const dto: CreateSystemStatusDto = { status: true };
      await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll()', () => {
    it('should call service.findAll with query', async () => {
      const query = { status: 'true' };
      await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne()', () => {
    it('should call service.findOne with id', async () => {
      const id = 'mockId';
      await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update()', () => {
    it('should call service.update with id and DTO', async () => {
      const id = 'mockId';
      const dto: UpdateSystemStatusDto = { status: false };
      await controller.update(id, dto);
      expect(service.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove()', () => {
    it('should call service.remove with id', async () => {
      const id = 'mockId';
      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
