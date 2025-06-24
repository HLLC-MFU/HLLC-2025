import { Test, TestingModule } from '@nestjs/testing';
import { LandmarksController } from './landmarks.controller';
import { LandmarksService } from '../service/landmarks.service';
import { CreateLandmarkDto } from '../dto/ladmarks/create-landmark.dto';
import { UpdateLandmarkDto } from '../dto/ladmarks/update-landmark.dto';
import { Localization, Location } from 'src/pkg/types/common';

describe('LandmarksController', () => {
  let controller: LandmarksController;
  let service: LandmarksService;

  const mockLandmarksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LandmarksController],
      providers: [
        {
          provide: LandmarksService,
          useValue: mockLandmarksService,
        },
      ],
    }).compile();

    controller = module.get<LandmarksController>(LandmarksController);
    service = module.get<LandmarksService>(LandmarksService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call service.create with CreateLandmarkDto', async () => {
      const dto: CreateLandmarkDto = {
        name: { th: 'ชื่อไทย', en: 'English Name' } as Localization,
        hint: { th: 'คำใบ้', en: 'Hint' } as Localization,
        hintImage: 'image.jpg',
        location: { latitude: 13.7, longitude: 100.5 } as Location,
        coinAmount: 10,
        cooldown: 60,
      };

      const req = { body: dto } as any;
      const mockResult = { _id: 'abc123', ...dto };
      mockLandmarksService.create.mockResolvedValue(mockResult);

      const result = await controller.create(req);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all landmarks', async () => {
      const query = { keyword: 'some' };
      const mockResult = [{ _id: '1' }, { _id: '2' }];
      mockLandmarksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return one landmark by id', async () => {
      const id = 'abc123';
      const mockResult = { _id: id };
      mockLandmarksService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update landmark with given id and dto', async () => {
      const id = 'abc123';
      const dto: UpdateLandmarkDto = {
        name: { th: 'ใหม่', en: 'New' },
      } as any;
      const req = { body: dto } as any;

      const mockResult = { _id: id, ...dto };
      mockLandmarksService.update.mockResolvedValue(mockResult);

      const result = await controller.update(id, req);
      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should remove landmark by id', async () => {
      const id = 'abc123';
      const mockResult = { deleted: true };
      mockLandmarksService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockResult);
    });
  });
});
