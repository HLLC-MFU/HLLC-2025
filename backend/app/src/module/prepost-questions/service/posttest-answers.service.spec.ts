import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PosttestAnswersService } from './posttest-answers.service';
import { Model, Types } from 'mongoose';
import { PosttestAnswer } from '../schema/posttest-answer.schema';
import { User } from 'src/module/users/schemas/user.schema';
import { PrepostQuestion } from '../schema/prepost-question.schema';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOneByFilter,
} from 'src/pkg/helper/query.util';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('src/pkg/helper/query.util');

const mockLean = (data: any) => jest.fn().mockResolvedValue(data);

describe('PosttestAnswersService', () => {
  let service: PosttestAnswersService;

  const mockPosttestAnswerModel = {
    exists: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
  };

  const mockUserModel = {
    exists: jest.fn(),
  };

  const mockPrepostQuestionModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosttestAnswersService,
        { provide: getModelToken('PosttestAnswer'), useValue: mockPosttestAnswerModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('PrepostQuestion'), useValue: mockPrepostQuestionModel },
      ],
    }).compile();

    service = module.get<PosttestAnswersService>(PosttestAnswersService);
  });

  describe('create', () => {
    it('should throw if user not found', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      await expect(service.create({ user: '123', answers: [] })).rejects.toThrow(NotFoundException);
    });

    it('should throw if invalid question type', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockPrepostQuestionModel.find.mockReturnValueOnce({
        select: () => ({ lean: mockLean([]) }),
      });
      await expect(service.create({
        user: '507f1f77bcf86cd799439011',
        answers: [{ posttest: new Types.ObjectId().toHexString(), answer: '1' }],
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw if answers already exist', async () => {
      const questionId = new Types.ObjectId().toHexString();
      mockUserModel.exists.mockResolvedValue(true);
      mockPrepostQuestionModel.find.mockReturnValueOnce({
        select: () => ({ lean: mockLean([{ _id: questionId }]) }),
      });
      mockPosttestAnswerModel.findOne.mockReturnValueOnce({
        select: () => ({ lean: mockLean({ answers: [{ posttest: questionId }] }) }),
      });

      await expect(service.create({
        user: '507f1f77bcf86cd799439011',
        answers: [{ posttest: questionId, answer: '2' }],
      })).rejects.toThrow(BadRequestException);
    });

    it('should insert new answers', async () => {
      const questionId = new Types.ObjectId().toHexString();
      mockUserModel.exists.mockResolvedValue(true);
      mockPrepostQuestionModel.find.mockReturnValueOnce({
        select: () => ({ lean: mockLean([{ _id: questionId }]) }),
      });
      mockPosttestAnswerModel.findOne.mockReturnValueOnce({
        select: () => ({ lean: mockLean({ answers: [] }) }),
      });
      (queryUpdateOneByFilter as jest.Mock).mockResolvedValue({ updated: true });

      const result = await service.create({
        user: '507f1f77bcf86cd799439011',
        answers: [{ posttest: questionId, answer: '3' }],
      });
      expect(result).toEqual({ updated: true });
    });
  });

  describe('findAll', () => {
    it('should return all results', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ meta: { total: 1 }, data: [] });
      const result = await service.findAll({});
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
  it('should return a posttest answer', async () => {
    const mockAnswer = { _id: '123', user: 'user1', answers: [] };
    (queryFindOne as jest.Mock).mockResolvedValue({ data: [mockAnswer], message: 'found' });

    const result = await service.findOne('123');

    expect(result.data).not.toBeNull();

    expect(result.data?.[0]).toEqual(expect.objectContaining({ _id: '123' }));


  });
});



  describe('remove', () => {
    it('should call queryDeleteOne', async () => {
      const mockDeletedResult = { deleted: true };
      (queryDeleteOne as jest.Mock).mockResolvedValue(mockDeletedResult);
      const result = await service.remove('123');
      expect(result).toEqual(expect.objectContaining({ deleted: true }));
    });
  });

  describe('averageAllPosttests', () => {
    it('should calculate average correctly', async () => {
      const question = { _id: new Types.ObjectId(), question: 'Q1' } as any;
      const answers = [
        { posttest: question, answer: '3' },
        { posttest: question, answer: '5' },
      ];
      (queryAll as jest.Mock).mockResolvedValue({ data: [{ answers }] });

      const result = await service.averageAllPosttests();
      expect(result[0].average).toBe(4);
      expect(result[0].count).toBe(2);
    });
  });
});
