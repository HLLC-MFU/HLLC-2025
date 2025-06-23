import { Test, TestingModule } from '@nestjs/testing';
import { InterfaceController } from './interfaces.controller';
import { InterfacesService } from './interfaces.service';
import { CreateInterfacesDto } from './dto/create-interfaces.dto';
import { UpdateInterfacesDto } from './dto/update-interfaces.dto';

const mockId = '60d21b4667d0d8992e610c85';

const mockInterface = {
  _id: mockId,
  school: '60d21b4667d0d8992e610c99',
  assets: { logo: 'logo.png', banner: 'banner.png' },
};

describe('InterfaceController', () => {
  let controller: InterfaceController;
  let service: InterfacesService;

  const mockInterfacesService = {
    create: jest.fn().mockResolvedValue(mockInterface),
    findAll: jest.fn().mockResolvedValue([mockInterface]),
    findOne: jest.fn().mockResolvedValue(mockInterface),
    update: jest.fn().mockResolvedValue({ ...mockInterface, assets: { logo: 'updated.png' } }),
    remove: jest.fn().mockResolvedValue(mockInterface),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterfaceController],
      providers: [
        {
          provide: InterfacesService,
          useValue: mockInterfacesService,
        },
      ],
    }).compile();

    controller = module.get<InterfaceController>(InterfaceController);
    service = module.get<InterfacesService>(InterfacesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create interface', async () => {
      const dto: CreateInterfacesDto = { school: mockInterface.school };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockInterface);
    });
  });

  describe('findAll', () => {
    it('should return all interfaces', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockInterface]);
    });
  });

  describe('findOne', () => {
    it('should return one interface', async () => {
      const result = await controller.findOne(mockId);
      expect(service.findOne).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockInterface);
    });
  });

  describe('update', () => {
    it('should update interface', async () => {
      const dto: UpdateInterfacesDto = { assets: { logo: 'updated.png' } };
      const result = await controller.update(mockId, dto);
      expect(service.update).toHaveBeenCalledWith(mockId, dto);
      expect(result?.assets.logo).toBe('updated.png');
    });
  });

  describe('remove', () => {
    it('should remove interface', async () => {
      const result = await controller.remove(mockId);
      expect(service.remove).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockInterface);
    });
  });
});
