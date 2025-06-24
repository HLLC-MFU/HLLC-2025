import { Test, TestingModule } from '@nestjs/testing';
import { MapsController } from './maps.controller';
import { MapsService } from '../service/maps.service';
import { CreateMapDto } from '../../coin-collections/dto/maps/create-map.dto';
import { UpdateMapDto } from '../../coin-collections/dto/maps/update-map.dto';

describe('MapsController', () => {
  let controller: MapsController;
  let service: MapsService;

  const mockMapsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MapsController],
      providers: [
        { provide: MapsService, useValue: mockMapsService },
      ],
    }).compile();

    controller = module.get<MapsController>(MapsController);
    service = module.get<MapsService>(MapsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call service.create with CreateMapDto', async () => {
      const dto: CreateMapDto = {
        name: 'Map 1',
        description: 'Some desc',
      } as any;

      const req = { body: dto } as any;
      mockMapsService.create.mockResolvedValue({ _id: '123', ...dto });

      const result = await controller.create(req);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ _id: '123', ...dto });
    });
  });

  describe('findAll', () => {
    it('should return all maps from service', async () => {
      const query = { keyword: 'map' };
      const mockResult = [{ _id: '1' }, { _id: '2' }];
      mockMapsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return one map by id', async () => {
      const id = 'abc123';
      const mockResult = { _id: id };
      mockMapsService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update the map with given id and dto', async () => {
      const id = 'abc123';
      const dto: UpdateMapDto = { name: 'Updated name' } as any;
      const req = { body: dto } as any;

      const updated = { _id: id, ...dto };
      mockMapsService.update.mockResolvedValue(updated);

      const result = await controller.update(id, req);
      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const id = 'abc123';
      mockMapsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({ deleted: true });
    });
  });
});
