import { Test, TestingModule } from '@nestjs/testing';
import { MajorsController } from './majors.controller';
import { MajorsService } from './majors.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { Types } from 'mongoose';

describe('MajorsController', () => {
  let controller: MajorsController;
  let service: MajorsService;

  const mockMajor = {
    _id: new Types.ObjectId(),
    name: { th: 'ชื่อ', en: 'Name' },
    acronym: 'SCI',
    detail: { th: 'รายละเอียด', en: 'Detail' },
    school: new Types.ObjectId(),
    createdAt: new Date(),
  };

  const serviceMock = {
    create: jest.fn().mockResolvedValue(mockMajor),
    findAll: jest.fn().mockResolvedValue([mockMajor]),
    findOne: jest.fn().mockResolvedValue(mockMajor),
    update: jest.fn().mockResolvedValue({ ...mockMajor, acronym: 'NEW' }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MajorsController],
      providers: [
        {
          provide: MajorsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<MajorsController>(MajorsController);
    service = module.get<MajorsService>(MajorsService);
  });

  describe('create', () => {
    it('should create a major and set createdAt', async () => {
      const dto: CreateMajorDto = {
        name: { th: 'ชื่อ', en: 'Name' },
        acronym: 'SCI',
        detail: { th: 'รายละเอียด', en: 'Detail' },
        school: new Types.ObjectId(),
        createdAt: undefined!,
      };

      const result = await controller.create(dto);

      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMajor);
    });
  });

  describe('findAll', () => {
    it('should return all majors', async () => {
      const query = { keyword: 'science' };
      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockMajor]);
    });
  });

  describe('findOne', () => {
    it('should return one major by id', async () => {
      const id = 'id123';
      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockMajor);
    });
  });

  describe('update', () => {
    it('should update a major and set updatedAt', async () => {
      const id = 'id123';
      const dto: UpdateMajorDto = {
        name: { th: 'ใหม่', en: 'New' },
        acronym: 'NEW',
        detail: { th: 'ใหม่', en: 'New' },
        updatedAt: undefined!,
      };

      const result = await controller.update(id, dto);
      expect(dto.updatedAt).toBeInstanceOf(Date);
      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual({ ...mockMajor, acronym: 'NEW' });
    });
  });

  describe('remove', () => {
    it('should remove a major by id', async () => {
      const id = 'id123';
      const result = await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({ deleted: true });
    });
  });
});
