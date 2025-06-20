import { Test, TestingModule } from '@nestjs/testing';
import { PrepostQuestionsService } from './prepost-questions.service';
import { getModelToken } from '@nestjs/mongoose';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { CreatePrepostQuestiontDto } from '../dto/prepost-question/create-prepost-question.dto';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { PrepostTypes } from '../enum/posttest-types.enum';
import { PrepostQuestionTypes } from '../enum/prepost-question-types.enum';

jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/query.util');

describe('PrepostQuestionsService', () => {
  let service: PrepostQuestionsService;
  let modelConstructor: jest.Mock;

  const mockPrepostQuestionModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    modelConstructor = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrepostQuestionsService,
        {
          provide: getModelToken('PrepostQuestion'),
          useValue: Object.assign(modelConstructor, mockPrepostQuestionModel),
        },
      ],
    }).compile();

    service = module.get<PrepostQuestionsService>(PrepostQuestionsService);
  });

  describe('create', () => {
    it('should throw if question exists', async () => {
      (throwIfExists as jest.Mock).mockRejectedValue(
        new Error('PrepostQuestion is already exists'),
      );

      const dto: Partial<CreatePrepostQuestiontDto> = {
        displayType: PrepostQuestionTypes.PRE,
        type: PrepostTypes.TEXT,
        question: 'What is NestJS?',
        order: 1,
      };

      await expect(
        service.create(dto as CreatePrepostQuestiontDto),
      ).rejects.toThrow('PrepostQuestion is already exists');
    });

    it('should return saved prepost question', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      const saveMock = jest.fn().mockResolvedValue({ _id: 'q1' });

      modelConstructor.mockImplementation(() => ({ save: saveMock }));

      const dto: CreatePrepostQuestiontDto = {
        displayType: PrepostQuestionTypes.PRE,
        type: PrepostTypes. TEXT,
        question: 'What is NestJS?',
        order: 1,
      };

      const result = await service.create(dto);
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
      const result = await service.update('q1', {
        question: 'Updated?',
      } as Partial<CreatePrepostQuestiontDto> as CreatePrepostQuestiontDto); 
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
