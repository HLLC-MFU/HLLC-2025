import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PretestAnswersService } from './pretest-answers.service';
import { PretestAnswer } from '../schema/pretest-answer.schema';
import { User } from 'src/module/users/schemas/user.schema';
import { PrepostQuestion } from '../schema/prepost-question.schema';
import { PrepostQuestionTypes } from '../enum/prepost-question-types.enum';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryFindOne: jest.fn(),
  queryDeleteOne: jest.fn(),
  queryUpdateOneByFilter: jest.fn(),
}));

import {
  queryAll,
  queryFindOne,
  queryDeleteOne,
  queryUpdateOneByFilter,
} from 'src/pkg/helper/query.util';

const userId = new Types.ObjectId().toHexString();
const questionId = new Types.ObjectId().toHexString();

const mockPretestAnswerModel = {
  exists: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};

const mockUserModel = {
  exists: jest.fn(),
};

const mockPrepostQuestionModel = {
  find: jest.fn(),
};

describe('PretestAnswersService', () => {
  let service: PretestAnswersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PretestAnswersService,
        { provide: getModelToken(PretestAnswer.name), useValue: mockPretestAnswerModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(PrepostQuestion.name), useValue: mockPrepostQuestionModel },
      ],
    }).compile();

    service = module.get<PretestAnswersService>(PretestAnswersService);
  });

  describe('create', () => {
    it('should throw if user not found', async () => {
      mockUserModel.exists.mockResolvedValue(null);

      await expect(
        service.create({ user: userId, answers: [] })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if any question is invalid', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockPrepostQuestionModel.find.mockReturnValueOnce({
        select: () => ({ lean: () => Promise.resolve([]) }),
      });

      await expect(
        service.create({
          user: userId,
          answers: [{ pretest: questionId, answer: '1' }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if answers already exist', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockPrepostQuestionModel.find.mockReturnValueOnce({
        select: () => ({
          lean: () =>
            Promise.resolve([{ _id: new Types.ObjectId(questionId) }]),
        }),
      });
      mockPretestAnswerModel.findOne.mockReturnValueOnce({
        select: () => ({
          lean: () =>
            Promise.resolve({ answers: [{ pretest: questionId }] }),
        }),
      });

      await expect(
        service.create({
          user: userId,
          answers: [{ pretest: questionId, answer: '1' }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should insert new answers successfully', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockPrepostQuestionModel.find.mockReturnValueOnce({
        select: () => ({
          lean: () =>
            Promise.resolve([
              { _id: new Types.ObjectId(questionId), displayType: PrepostQuestionTypes.PRE },
            ]),
        }),
      });
      mockPretestAnswerModel.findOne.mockReturnValueOnce({
        select: () => ({ lean: () => Promise.resolve({ answers: [] }) }),
      });
      (queryUpdateOneByFilter as jest.Mock).mockResolvedValue({ success: true });

      const result = await service.create({
        user: userId,
        answers: [{ pretest: questionId, answer: '1' }],
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('findAll', () => {
    it('should call queryAll', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });
      const result = await service.findAll({});
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue({ data: { _id: '123' }, message: 'ok' });
      const result = await service.findOne('123');
      expect(result.message).toBe('ok');
    });
  });

 describe('remove', () => {
  it('should return object with deleted: true', async () => {
    const mockResult = { deleted: true };
    (queryDeleteOne as jest.Mock).mockResolvedValue(mockResult);

    const result = await service.remove('123');

    expect(result).toEqual(expect.objectContaining({ deleted: true }));
  });
});


  describe('averageAllPretests', () => {
    it('should return average per pretest question', async () => {
      const mockQuestion = { _id: new Types.ObjectId(), question: 'Q1' } ;
      const answers = [
        { pretest: mockQuestion, answer: '3' },
        { pretest: mockQuestion, answer: '5' },
      ];

      (queryAll as jest.Mock).mockResolvedValue({ data: [{ answers }] });

      const result = await service.averageAllPretests();
      expect(result[0].average).toBe(4);
      expect(result[0].count).toBe(2);
    });
  });
});
