import { Test, TestingModule } from '@nestjs/testing';
import { SponsorsTypeController } from './sponsors-type.controller';
import { SponsorsTypeService } from '../service/sponsors-type.service';
import { CreateSponsorsTypeDto } from '../dto/sponsers-type/create-sponsors-type.dto';
import { UpdateSponsorsTypeDto } from '../dto/sponsers-type/update-sponsors-type.dto';

describe('SponsorsTypeController', () => {
  let controller: SponsorsTypeController;
  let service: SponsorsTypeService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCreateDto: CreateSponsorsTypeDto = {
    name:'ChongKo',
  };

  const mockUpdateDto: UpdateSponsorsTypeDto = {
    name:'Buba',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SponsorsTypeController],
      providers: [{ provide: SponsorsTypeService, useValue: mockService }],
    }).compile();

    controller = module.get<SponsorsTypeController>(SponsorsTypeController);
    service = module.get<SponsorsTypeService>(SponsorsTypeService);
  });

  it('should call service.create()', async () => {
    const result = { _id: '1', ...mockCreateDto };
    mockService.create.mockResolvedValue(result);

    expect(await controller.create(mockCreateDto)).toEqual(result);
    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
  });

  it('should call service.findAll()', async () => {
    const query = { keyword: 'type' };
    const result = [{ _id: '1', ...mockCreateDto }];
    mockService.findAll.mockResolvedValue(result);

    expect(await controller.findAll(query)).toEqual(result);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should call service.findOne()', async () => {
    const result = { _id: '1', ...mockCreateDto };
    mockService.findOne.mockResolvedValue(result);

    expect(await controller.findOne('1')).toEqual(result);
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('should call service.update()', async () => {
    const result = { _id: '1', ...mockUpdateDto };
    mockService.update.mockResolvedValue(result);

    expect(await controller.update('1', mockUpdateDto)).toEqual(result);
    expect(service.update).toHaveBeenCalledWith('1', mockUpdateDto);
  });

  it('should call service.remove()', async () => {
    const result = { deleted: true };
    mockService.remove.mockResolvedValue(result);

    expect(await controller.remove('1')).toEqual(result);
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
