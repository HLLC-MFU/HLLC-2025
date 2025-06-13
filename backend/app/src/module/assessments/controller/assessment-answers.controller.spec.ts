import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentAnswersController } from './assessment-answers.controller';
import { AssessmentAnswersService } from '../service/assessment-answers.service';
import { CreateAssessmentAnswerDto } from '../dto/assessment-answers/create-assessment-answer.dto';
import { Types } from 'mongoose';

describe('AssessmentAnswersController', () => {
  let controller: AssessmentAnswersController;

  const mockAssessmentAnswer = {
    _id: new Types.ObjectId().toHexString(),
    user: new Types.ObjectId().toHexString(),
    answers: [
      {
        assessment: new Types.ObjectId().toHexString(),
        answer: 'yes',
      },
    ],
  };

  const serviceMock = {
    create: jest.fn().mockResolvedValue(mockAssessmentAnswer),
    findAll: jest.fn().mockResolvedValue({ data: [mockAssessmentAnswer], meta: {} }),
    findOne: jest.fn().mockResolvedValue({ data: [mockAssessmentAnswer], message: 'ok' }),
    remove: jest.fn().mockResolvedValue({
      message: 'Assessment answer deleted successfully',
      id: mockAssessmentAnswer._id,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentAnswersController],
      providers: [
        {
          provide: AssessmentAnswersService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<AssessmentAnswersController>(AssessmentAnswersController);
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto: CreateAssessmentAnswerDto = {
        user: mockAssessmentAnswer.user,
        answers: [
          {
            assessment: mockAssessmentAnswer.answers[0].assessment,
            answer: 'yes',
          },
        ],
      };

      const result = await controller.create(dto);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAssessmentAnswer);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { user: mockAssessmentAnswer.user };
      const result = await controller.findAll(query);
      expect(serviceMock.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual({ data: [mockAssessmentAnswer], meta: {} });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = await controller.findOne(mockAssessmentAnswer._id);
      expect(serviceMock.findOne).toHaveBeenCalledWith(mockAssessmentAnswer._id);
      expect(result).toEqual({ data: [mockAssessmentAnswer], message: 'ok' });
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const result = await controller.remove(mockAssessmentAnswer._id);
      expect(serviceMock.remove).toHaveBeenCalledWith(mockAssessmentAnswer._id);
      expect(result).toEqual({
        message: 'Assessment answer deleted successfully',
        id: mockAssessmentAnswer._id,
      });
    });
  });
});
