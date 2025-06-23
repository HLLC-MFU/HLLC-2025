import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AssessmentsService } from './assessments.service';
import { Assessment } from '../schema/assessment.schema';
import { CreateAssessmentDto } from '../dto/assessments/create-assessment.dto';
import { UpdateAssessmentDto } from '../dto/assessments/update-assessment.dto';
import { AssessmentTypes } from '../enum/assessment-types.enum';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/helper/helpers', () => ({
  handleMongoDuplicateError: jest.fn(),
}));

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryUpdateOne: jest.fn(),
  queryDeleteOne: jest.fn(),
}));

describe('AssessmentsService', () => {
  let service: AssessmentsService;
  let assessmentModel: { save: jest.Mock };

  beforeEach(async () => {
    assessmentModel = { save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        {
          provide: getModelToken(Assessment.name),
          useValue: jest.fn().mockImplementation(() => assessmentModel),
        },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateAssessmentDto = {
      question: { th: 'คำถาม', en: 'Question' },
      type: AssessmentTypes.TEXT,
      activity: 'activityId',
      order: 1,
    };

    it('should create assessment successfully', async () => {
      assessmentModel.save.mockResolvedValue({ _id: 'a1', ...dto });

      const result = await service.create(dto);
      expect(result).toEqual(expect.objectContaining({ _id: 'a1' }));
      expect(assessmentModel.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all assessments', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: [], meta: {} });
      const result = await service.findAll({});
      expect(queryAll).toHaveBeenCalled();
      expect(result).toEqual({ data: [], meta: {} });
    });
  });

  describe('findOne', () => {
    it('should return one assessment', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue({ data: [{ _id: '1' }], message: 'ok' });
      const result = await service.findOne('1');
      expect(result).toEqual({ data: [{ _id: '1' }], message: 'ok' });
    });
  });

  describe('update', () => {
    it('should update assessment with updatedAt', async () => {
      const updateDto: UpdateAssessmentDto = {
        question: { th: 'ใหม่', en: 'New' },
        type: AssessmentTypes.TEXT,
        activity: 'activityId',
      };

      (queryUpdateOne as jest.Mock).mockResolvedValue({ _id: '1', ...updateDto });
      const result = await service.update('1', updateDto);
      expect(result).toEqual(expect.objectContaining({ _id: '1' }));
    });
  });

  describe('remove', () => {
    it('should delete assessment', async () => {
      const result = await service.remove('123');
      expect(queryDeleteOne).toHaveBeenCalledWith(expect.anything(), '123');
      expect(result).toEqual({ message: 'Assessment deleted successfully', id: '123' });
    });
  });

  describe('findAllByActivity', () => {
    it('should return all assessments by activity', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: ['a'], meta: {} });
      const result = await service.findAllByActivity('activityId');
      expect(queryAll).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { activity: 'activityId' },
        })
      );
      expect(result).toEqual({ data: ['a'], meta: {} });
    });
  });
});