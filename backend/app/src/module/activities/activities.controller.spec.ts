import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: ActivitiesService;

  const mockActivity = {
    _id: 'activityId123',
    name: { th: 'กิจกรรม', en: 'Activity' },
    acronym: 'ACT',
    metadata: { scope: { major: [], school: [], user: [] } },
  };

  const serviceMock = {
    create: jest.fn().mockResolvedValue(mockActivity),
    findAll: jest.fn().mockResolvedValue([mockActivity]),
    findOne: jest.fn().mockResolvedValue(mockActivity),
    update: jest.fn().mockResolvedValue({ ...mockActivity, acronym: 'NEW' }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        { provide: ActivitiesService, useValue: serviceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get<ActivitiesService>(ActivitiesService);
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateActivitiesDto = {
        name: { th: 'ชื่อ', en: 'Name' },
        acronym: 'ACT',
        fullDetails: { th: 'เต็ม', en: 'Full' },
        shortDetails: { th: 'ย่อ', en: 'Short' },
        type: 'type123',
        photo: { coverPhoto: '', bannerPhoto: '', thumbnail: '', logoPhoto: '' },
        location: { th: 'ที่ตั้ง', en: 'Location' },
      };
      const req = { body: dto } as any;
      const result = await controller.create(req);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockActivity);
    });
  });

  describe('findAll', () => {
    it('should return all activities for user', async () => {
      const query = {};
      const req = { user: { _id: 'user123' } } as any;
      const result = await controller.findAll(query, req);
      expect(service.findAll).toHaveBeenCalledWith(query, req.user);
      expect(result).toEqual([mockActivity]);
    });
  });

  describe('findOne', () => {
    it('should return single activity by id', async () => {
      const id = 'activityId123';
      const req = { user: { _id: 'user123' } } as any;
      const result = await controller.findOne(id, req);
      expect(service.findOne).toHaveBeenCalledWith(id, 'user123');
      expect(result).toEqual(mockActivity);
    });
  });

  describe('update', () => {
    it('should update activity with given dto', async () => {
      const dto: UpdateActivityDto = { acronym: 'NEW' };
      const req = { body: dto } as any;
      const result = await controller.update('activityId123', req);
      expect(service.update).toHaveBeenCalledWith('activityId123', dto);
      expect(result).toEqual({ ...mockActivity, acronym: 'NEW' });
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const result = await controller.remove('activityId123');
      expect(service.remove).toHaveBeenCalledWith('activityId123');
      expect(result).toEqual({ deleted: true });
    });
  });
});
