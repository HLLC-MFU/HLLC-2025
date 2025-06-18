import { Test, TestingModule } from '@nestjs/testing';
import { AppearancesController } from './appearances.controller';
import { AppearancesService } from './appearances.service';
import { FastifyRequest } from 'fastify';

describe('AppearancesController', () => {
  let controller: AppearancesController;
  let service: AppearancesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppearancesController],
      providers: [
        {
          provide: AppearancesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppearancesController>(AppearancesController);
    service = module.get<AppearancesService>(AppearancesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call service.create with dto from request body', async () => {
      const req = { body: { school: 'abc123' } } as FastifyRequest;
      const result = { _id: 'xyz' };
      mockService.create.mockResolvedValue(result);

      const res = await controller.create(req);
      expect(service.create).toHaveBeenCalledWith(req.body);
      expect(res).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { school: 'abc123' };
      const result = ['data'];
      mockService.findAll.mockResolvedValue(result);

      const res = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(res).toEqual(result);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = { _id: 'abc' };
      mockService.findOne.mockResolvedValue(result);

      const res = await controller.findOne('abc');
      expect(service.findOne).toHaveBeenCalledWith('abc');
      expect(res).toEqual(result);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto from request body', async () => {
      const req = { body: { colors: { primary: '#fff' } } } as FastifyRequest;
      const result = { updated: true };
      mockService.update.mockResolvedValue(result);

      const res = await controller.update('abc123', req);
      expect(service.update).toHaveBeenCalledWith('abc123', req.body);
      expect(res).toEqual(result);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const result = { deleted: true };
      mockService.remove.mockResolvedValue(result);

      const res = await controller.remove('abc123');
      expect(service.remove).toHaveBeenCalledWith('abc123');
      expect(res).toEqual(result);
    });
  });
});
