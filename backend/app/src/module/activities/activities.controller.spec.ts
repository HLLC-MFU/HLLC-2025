import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { FastifyRequest } from 'fastify';

// 👇 Helper type เพื่อ mock Request ที่มี user แบบ FastifyRequest
type MockedUserRequest<T = any> = FastifyRequest & {
  user: {
    _id: string;
    metadata: {
      school: {
        _id: string;
        name: Record<string, string>;
      };
      major: {
        _id: string;
        name: Record<string, string>;
      };
    };
  };
  body?: T;
};

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: ActivitiesService;

  const mockUser = {
    _id: 'user123',
    metadata: {
      school: {
        _id: 'school123',
        name: { th: 'โรงเรียน A', en: 'School A' },
      },
      major: {
        _id: 'major123',
        name: { th: 'วิชาเอก B', en: 'Major B' },
      },
    },
  };

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
      providers: [{ provide: ActivitiesService, useValue: serviceMock }],
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
        photo: {
          coverPhoto: '',
          bannerPhoto: '',
          thumbnail: '',
          logoPhoto: '',
        },
        location: { th: 'ที่ตั้ง', en: 'Location' },
      };

      const req: MockedUserRequest<CreateActivitiesDto> = {
        user: mockUser,
        body: dto,
      } as Pick<FastifyRequest, 'body' | 'user'> & MockedUserRequest<CreateActivitiesDto>;

      const result = await controller.create(req);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockActivity);
    });
  });

  describe('findAll', () => {
    it('should return all activities for user', async () => {
      const query = {};
      const req: MockedUserRequest = {
        user: mockUser,
      } as Pick<FastifyRequest, 'body' | 'user'> & MockedUserRequest<CreateActivitiesDto>

      const result = await controller.findAll(query, req);
      expect(service.findAll).toHaveBeenCalledWith(query, mockUser);
      expect(result).toEqual([mockActivity]);
    });
  });

  describe('findOne', () => {
    it('should return single activity by id', async () => {
      const req: MockedUserRequest = {
        user: mockUser,
      } as Pick<FastifyRequest, 'body' | 'user'> & MockedUserRequest<CreateActivitiesDto>

      const result = await controller.findOne('activityId123', req);
      expect(service.findOne).toHaveBeenCalledWith('activityId123', 'user123');
      expect(result).toEqual(mockActivity);
    });
  });

  describe('update', () => {
    it('should update activity with given dto', async () => {
      const dto: UpdateActivityDto = { acronym: 'NEW' };

      const req: MockedUserRequest<UpdateActivityDto> = {
        user: mockUser,
        body: dto,
      } as Pick<FastifyRequest, 'body' | 'user'> & MockedUserRequest<CreateActivitiesDto>

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
