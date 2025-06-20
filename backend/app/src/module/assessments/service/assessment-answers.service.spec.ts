import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AssessmentAnswersService } from './assessment-answers.service';
import { AssessmentAnswer} from '../schema/assessment-answer.schema';
import { User } from '../../users/schemas/user.schema';
import { CreateAssessmentAnswerDto } from '../dto/assessment-answers/create-assessment-answer.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Assessment } from '../schema/assessment.schema';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOneByFilter,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryDeleteOne: jest.fn(),
  queryFindOne: jest.fn(),
  queryUpdateOneByFilter: jest.fn(),
}));

describe('AssessmentAnswersService', () => {
  let service: AssessmentAnswersService;
  let assessmentAnswerModel: any;
  let userModel: any;
  let assessmentModel: any;

  beforeEach(async () => {
    assessmentAnswerModel = {
      findOne: jest.fn(),
    };

    userModel = {
      exists: jest.fn(),
    };

    assessmentModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentAnswersService,
        {
          provide: getModelToken(AssessmentAnswer.name),
          useValue: assessmentAnswerModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: getModelToken(Assessment.name),
          useValue: assessmentModel,
        },
      ],
    }).compile();

    service = module.get<AssessmentAnswersService>(AssessmentAnswersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const userId = new Types.ObjectId().toHexString();
    const assessmentId1 = new Types.ObjectId().toHexString();
    const assessmentId2 = new Types.ObjectId().toHexString();

    const dto: CreateAssessmentAnswerDto = {
      user: userId,
      answers: [
        { assessment: assessmentId1, answer: 'yes' },
        { assessment: assessmentId2, answer: 'no' },
      ],
    };

    it('should throw if user does not exist', async () => {
      userModel.exists.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw if all assessments already exist', async () => {
      userModel.exists.mockResolvedValue(true);
      assessmentAnswerModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          answers: [
            { assessment: new Types.ObjectId(assessmentId1) },
            { assessment: new Types.ObjectId(assessmentId2) },
          ],
        }),
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should call queryUpdateOneByFilter with new answers', async () => {
      userModel.exists.mockResolvedValue(true);
      assessmentAnswerModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          answers: [{ assessment: new Types.ObjectId(assessmentId1) }],
        }),
      });

      await service.create(dto);

      expect(queryUpdateOneByFilter).toHaveBeenCalledWith(
        assessmentAnswerModel,
        { user: expect.any(Types.ObjectId) },
        expect.objectContaining({
          $addToSet: {
            answers: {
              $each: [
                {
                  assessment: expect.any(Types.ObjectId),
                  answer: 'no',
                },
              ],
            },
          },
        }),
        { upsert: true },
      );
    });
  });

  describe('findAll', () => {
    it('should return result from queryAll', async () => {
      (queryAll as jest.Mock).mockResolvedValue({ data: [], meta: {} });
      const result = await service.findAll({});
      expect(result).toEqual({ data: [], meta: {} });
    });
  });

  describe('findOne', () => {
    it('should return result from queryFindOne', async () => {
      (queryFindOne as jest.Mock).mockResolvedValue({ data: ['result'], message: 'ok' });
      const result = await service.findOne('someId');
      expect(result).toEqual({ data: ['result'], message: 'ok' });
    });
  });

  describe('remove', () => {
    it('should return success message and id', async () => {
      const result = await service.remove('id123');
      expect(queryDeleteOne).toHaveBeenCalledWith(assessmentAnswerModel, 'id123');
      expect(result).toEqual({ message: 'Assessment answer deleted successfully', id: 'id123' });
    });
  });

  describe('averageAllAssessments', () => {
    it('should calculate average per assessment', async () => {
      const assessment = { _id: new Types.ObjectId(), title: 'Assessment A' };
      const mockAnswers = [
        {
          answers: [
            { assessment, answer: '4' },
            { assessment, answer: '6' },
          ],
        },
      ];
      (queryAll as jest.Mock).mockResolvedValue({ data: mockAnswers });

      const result = await service.averageAllAssessments();

      expect(result).toEqual([
        {
          assessment,
          average: 5,
          count: 2,
        },
      ]);
    });
  });

  describe('averageAssessmentsByActivity', () => {
    it('should calculate average only for assessments of specified activity', async () => {
      const activityId = new Types.ObjectId().toHexString();
      const assessment = { _id: new Types.ObjectId(), activity: activityId };
      assessmentModel.find.mockResolvedValue([assessment]);

      const mockAnswers = [
        {
          answers: [
            { assessment, answer: '2' },
            { assessment: { _id: new Types.ObjectId() }, answer: '99' }, // should be ignored
          ],
        },
      ];

      (queryAll as jest.Mock).mockResolvedValue({ data: mockAnswers });

      const result = await service.averageAssessmentsByActivity(activityId);

      expect(result).toEqual([
        {
          assessment,
          average: 2,
          count: 1,
        },
      ]);
    });
  });
});
