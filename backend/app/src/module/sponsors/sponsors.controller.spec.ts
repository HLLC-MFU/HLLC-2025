import { Test, TestingModule } from '@nestjs/testing';
import { SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { Types } from 'mongoose';
import { FastifyRequest } from 'fastify';

describe('SponsorsController', () => {
  let controller: SponsorsController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const objectId = new Types.ObjectId().toString();
  const fixedDate = new Date('2025-01-01T00:00:00Z');

  const mockCreateDto: CreateSponsorDto = {
    
    name: { th: 'ชื่อ', en: 'Name' },
    photo: {
      coverPhoto: '',
      bannerPhoto: '',
      thumbnail: '',
      logoPhoto: 'C:/Users/youmi/Downloads/twitter.png',
    },
    type: objectId,
    metadata: { note: 'mock test' },
  };

  const mockUpdateDto: UpdateSponsorDto = {
    ...mockCreateDto,
    name: { th: 'แก้ไข', en: 'updated' },
    updatedAt: fixedDate,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(fixedDate);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SponsorsController],
      providers: [
        {
          provide: SponsorsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SponsorsController>(SponsorsController);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create()', () => {
    it('should create sponsor', async () => {
      const req: Partial<FastifyRequest> = { body: mockCreateDto };
      mockService.create.mockResolvedValue({ _id: '1', ...mockCreateDto });

      const result = await controller.create(req as FastifyRequest);
      expect(result).toEqual({ _id: '1', ...mockCreateDto });
      expect(mockService.create).toHaveBeenCalledWith(mockCreateDto);
    });
  });

  describe('findAll()', () => {
    it('should return all sponsors', async () => {
      mockService.findAll.mockResolvedValue({ data: ['sponsor1'] });

      const result = await controller.findAll({});
      expect(result).toEqual({ data: ['sponsor1'] });
    });
  });

  describe('findOne()', () => {
    it('should return one sponsor', async () => {
      mockService.findOne.mockResolvedValue({ _id: '1', ...mockCreateDto });

      const result = await controller.findOne('1');
      expect(result).toEqual({ _id: '1', ...mockCreateDto });
    });
  });

  describe('update()', () => {
    it('should update sponsor', async () => {
      const req: Partial<FastifyRequest> = { body: mockUpdateDto };
      mockService.update.mockResolvedValue({ _id: '1', ...mockUpdateDto });

      const result = await controller.update('1', req as FastifyRequest);

      expect(result).toEqual({ _id: '1', ...mockUpdateDto });
      expect(mockService.update).toHaveBeenCalledTimes(1);
      expect(mockService.update).toHaveBeenCalledWith('1', mockUpdateDto);
    });
  });

  describe('remove()', () => {
    it('should delete sponsor', async () => {
      mockService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('1');
      expect(result).toEqual({ deleted: true });
    });
  });
});
