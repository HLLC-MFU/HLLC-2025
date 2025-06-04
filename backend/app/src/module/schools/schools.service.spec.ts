import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsService } from './schools.service';
import { getModelToken } from '@nestjs/mongoose';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { Types } from 'mongoose';
import { MongoServerError } from 'mongodb';

class MockedMongoServerError extends MongoServerError {
  override code: number;
  keyPattern: Record<string, number>;
  keyValue: Record<string, { th: string; en: string }>;

  constructor(
    message: string, 
    code: number,
    keyPattern: Record<string, number>,
    keyValue: Record<string, { th: string; en: string }>
  ) {
    super({message});
    this.code = code;
    this.keyPattern = keyPattern;
    this.keyValue = keyValue;
  }
}

const fixedDate = new Date('2025-06-04T09:17:53.319Z');

describe('SchoolsService', () => {
  let service: SchoolsService;
  let objectId: string;
  let saveMock: jest.Mock;

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers(); 
  });

  class MockSchoolModel {
    static exists = jest.fn();
    static findOne = jest.fn();
    static find = jest.fn();
    static findByIdAndUpdate = jest.fn();
    static findByIdAndDelete = jest.fn();
    static countDocuments = jest.fn();

    save: jest.Mock;

    constructor(data: CreateSchoolDto) {
      Object.assign(this, data);
      this.save = saveMock;
    }
  }

  const mockCreateDto: CreateSchoolDto = {
    name: { th: 'โรงเรียนทดสอบ', en: 'Test School' },
    acronym: 'TS',
    detail: { th: 'รายละเอียดภาษาไทย', en: 'English details' },
    photo: 'photo.png',
    createdAt: fixedDate,
  };

  const mockUpdateDto: UpdateSchoolDto = {
    ...mockCreateDto,
    name: { ...mockCreateDto.name, en: 'Updated School' },
    acronym: 'US',
    updatedAt: fixedDate,
  };

  beforeEach(async () => {
    objectId = new Types.ObjectId().toString();
    saveMock = jest.fn().mockResolvedValue({ ...mockCreateDto });

    MockSchoolModel.exists.mockResolvedValue(null);
    MockSchoolModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ updatedAt: new Date() }),
    });
    MockSchoolModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([mockCreateDto]), 
    });

    MockSchoolModel.findByIdAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ ...mockUpdateDto, _id: objectId }),
    });
    MockSchoolModel.findByIdAndDelete.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: objectId }),
    });
    MockSchoolModel.countDocuments.mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        {
          provide: getModelToken('School'),
          useValue: MockSchoolModel,
        },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new school', async () => {
      const result = await service.create(mockCreateDto);
      expect(result).toEqual(mockCreateDto);
    });

    it('should throw error when duplicate school', async () => {
      const duplicateError = new MockedMongoServerError(
        'Duplicate key error: name',
        11000,
        { name: 1 },
        { name: mockCreateDto.name }
      );

      MockSchoolModel.exists.mockResolvedValue(null);
      saveMock.mockRejectedValueOnce(duplicateError);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        `name already exists`
      );
    });
  });

  describe('findAll', () => {
    it('should return all schools', async () => {
      const result = await service.findAll({});
      expect(result.data).toEqual([mockCreateDto]);
    });
  });

  describe('findOne', () => {
    it('should return one school by id', async () => {
      MockSchoolModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ _id: objectId, name: 'Some School' }),
      });

      const result = await service.findOne(objectId);
      expect(result.data![0]).toEqual({ _id: objectId, name: 'Some School' });
    });
  });

  describe('update', () => {
    it('should update the school and return updated object', async () => {
      const result = await service.update(objectId, mockUpdateDto);
      expect(result).toEqual({ ...mockUpdateDto, _id: objectId });
    });
  });

  describe('remove', () => {
    it('should delete the school', async () => {
      const result = await service.remove(objectId);
      expect(result).toEqual({
        message: 'School deleted successfully',
        id: objectId,
      });
    });
  });
});
