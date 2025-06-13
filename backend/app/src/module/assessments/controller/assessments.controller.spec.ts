import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from '../service/assessments.service';
import { CreateAssessmentDto } from '../dto/assessments/create-assessment.dto';
import { UpdateAssessmentDto } from '../dto/assessments/update-assessment.dto';
import { AssessmentTypes } from '../enum/assessment-types.enum';


  let controller: AssessmentsController;
  let serviceMock: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    findAllByActivity: jest.Mock;
  };

  const mockAssessment = {
    _id: 'mockId',
    question: { th: 'คำถาม', en: 'Question' },
    type: AssessmentTypes.TEXT,
    activity: 'activityId',
    order: 1,
  };

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn().mockResolvedValue(mockAssessment),
      findAll: jest.fn().mockResolvedValue({ data: [mockAssessment], meta: {} }),
      findOne: jest.fn().mockResolvedValue({ data: mockAssessment }),
      update: jest.fn().mockResolvedValue({ ...mockAssessment, order: 2 }),
      remove: jest.fn().mockResolvedValue({ message: 'Assessment deleted successfully', id: 'mockId' }),
      findAllByActivity: jest.fn().mockResolvedValue({ data: [mockAssessment], meta: {} }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentsController],
      providers: [{ provide: AssessmentsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AssessmentsController>(AssessmentsController);
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto: CreateAssessmentDto = {
        question: { th: 'คำถาม', en: 'Question' },
        type: AssessmentTypes.TEXT,
        activity: 'activityId',
        order: 1,
      };
      const result = await controller.create(dto);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAssessment);
    });


  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { activity: 'activityId' };
      const result = await controller.findAll(query);
      expect(serviceMock.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual({ data: [mockAssessment], meta: {} });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = await controller.findOne('mockId');
      expect(serviceMock.findOne).toHaveBeenCalledWith('mockId');
      expect(result).toEqual({ data: mockAssessment });
    });
  });

  describe('update', () => {
    it('should call service.update with updatedAt injected', async () => {
      const dto: UpdateAssessmentDto = {
        question: { th: 'ใหม่', en: 'New' },
        type: AssessmentTypes.TEXT,
        activity: 'activityId',
        updatedAt: new Date(),
      };

      const beforeCall = Date.now();
      const result = await controller.update('mockId', dto);
      const afterCall = Date.now();

      const updatedDto = serviceMock.update.mock.calls[0][1];
      expect(updatedDto.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCall);
      expect(updatedDto.updatedAt.getTime()).toBeLessThanOrEqual(afterCall);
      expect(serviceMock.update).toHaveBeenCalledWith('mockId', expect.objectContaining(dto));
      expect(result.order).toEqual(2);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const result = await controller.remove('mockId');
      expect(serviceMock.remove).toHaveBeenCalledWith('mockId');
      expect(result).toEqual({ message: 'Assessment deleted successfully', id: 'mockId' });
    });
  });

  describe('listByActivity', () => {
    it('should call service.findAllByActivity with activityId', async () => {
      const result = await controller.listByActivity('activityId');
      expect(serviceMock.findAllByActivity).toHaveBeenCalledWith('activityId');
      expect(result).toEqual({ data: [mockAssessment], meta: {} });
    });
  });
});
