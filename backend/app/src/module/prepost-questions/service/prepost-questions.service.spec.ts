import { Test, TestingModule } from '@nestjs/testing';
import { PrepostQuestionsService } from './prepost-questions.service';
import { getModelToken } from '@nestjs/mongoose';
import { PrepostQuestion } from '../schema/prepost-question.schema';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/helpers');
jest.mock('src/pkg/helper/query.util');

describe('PrepostQuestionsService', () => {
  let service: PrepostQuestionsService;
  const mockPrepostQuestionModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrepostQuestionsService,
        {
          provide: getModelToken('PrepostQuestion'),
          useValue: mockPrepostQuestionModel,
        },
      ],
    }).compile();

    service = module.get<PrepostQuestionsService>(PrepostQuestionsService);
  });

  describe('create', () => {
    it('should throw if question exists', async () => {
      (throwIfExists as jest.Mock).mockRejectedValue(
        new Error('PrepostQuestion is already exists')
      );
      await expect(
        service.create({
          displayType: 'PRE',
          type: 'MCQ',
          question: 'What is NestJS?',
          order: 1,
        } as any)
      ).rejects.toThrow('PrepostQuestion is already exists');
    });

    it('should return saved prepost question', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      const saveMock = jest.fn().mockResolvedValue({ _id: 'q1' });
      const modelConstructor = jest
        .fn()
        .mockImplementation(() => ({ save: saveMock }));
      const module = await Test.createTestingModule({
        providers: [
          PrepostQuestionsService,
          {
            provide: getModelToken('PrepostQuestion'),
            useValue: Object.assign(modelConstructor, mockPrepostQuestionModel),
          },
        ],
      }).compile();

      service = module.get<PrepostQuestionsService>(PrepostQuestionsService);

      const result = await service.create({
        displayType: 'PRE',
        type: 'MCQ',
        question: 'What is NestJS?',
        order: 1,
      } as any);
      expect(result).toEqual({ _id: 'q1' });
    });
  });

  describe('findAll', () => {
    it('should return all questions', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });
      const result = await service.findAll({});
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
  it('should return one question with specific id', async () => {
  const mockQuestion = { _id: 'q1' };
  (queryFindOne as jest.Mock).mockResolvedValue({ data: mockQuestion });

  const result = await service.findOne('q1');
  expect(result.data).toEqual(mockQuestion);
});

  });

  describe('update', () => {
    it('should call queryUpdateOne', async () => {
      (queryUpdateOne as jest.Mock).mockResolvedValue({ updated: true });
      const result = await service.update('q1', { question: 'Updated?' } as any);
      expect(result).toEqual({ updated: true });
    });
  });

  describe('remove', () => {
    it('should return deleted message', async () => {
      (queryDeleteOne as jest.Mock).mockResolvedValue({});
      const result = await service.remove('q1');
      expect(result).toEqual({
        message: 'PrepostQuestion deleted successfully',
        id: 'q1',
      });
    });
  });
});
