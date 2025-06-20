import { Test, TestingModule } from '@nestjs/testing';
import { EvoucherController } from './evoucher.controller';
import { EvoucherService } from '../service/evoucher.service';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/evouchers/update-evoucher.dto';
import { Evoucher, EvoucherType, EvoucherStatus } from '../schema/evoucher.schema';
import { Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';


describe('EvoucherController', () => {
  let controller: EvoucherController;
  let service: EvoucherService;

  const mockEvoucher: Evoucher = {
    discount: '10%',
    acronym: 'PROMO10',
    type: EvoucherType.GLOBAL,
    sponsors: new Types.ObjectId('60f6d62c4a3f1c2f5c8e6a96'),
    detail: { th: 'เวาเชอร์', en: 'Voucher' },
    expiration: new Date(),
    photo: {
      coverPhoto: '',
      bannerPhoto: '',
      thumbnail: '',
      logoPhoto: '',
      evoucherImage: '',
      evoucherImageFront: 'front.png',
      evoucherImageBack: 'back.png',
    },
    maxClaims: 5,
    status: EvoucherStatus.ACTIVE,
    metadata: { campaign: 'summer' },
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockEvoucher),
    findAll: jest.fn().mockResolvedValue([mockEvoucher]),
    findOne: jest.fn().mockResolvedValue(mockEvoucher),
    getPublicAvailableEvouchersForUser: jest.fn().mockResolvedValue([mockEvoucher]),
    update: jest.fn().mockResolvedValue(mockEvoucher),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

 

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [EvoucherController],
    providers: [
      { provide: EvoucherService, useValue: mockService },
      { provide: CACHE_MANAGER, useValue: {} }, 
    ],
  }).compile();
    controller = module.get<EvoucherController>(EvoucherController);
    service = module.get<EvoucherService>(EvoucherService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an evoucher', async () => {
      const dto: CreateEvoucherDto = {
        discount: '10%',
        acronym: 'PROMO10',
        type: EvoucherType.GLOBAL,
        sponsors: '60f6d62c4a3f1c2f5c8e6a96',
        expiration: mockEvoucher.expiration,
        detail: { th: 'เวาเชอร์', en: 'Voucher' },
        photo: mockEvoucher.photo,
        maxClaims: 5,
        metadata: { campaign: 'summer' },
        status: true,
      };

      const result = await controller.create(dto);
      expect(result).toEqual(mockEvoucher);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all evouchers', async () => {
      const query = { page: '1' };
      const result = await controller.findAll(query);
      expect(result).toEqual([mockEvoucher]);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return one evoucher by id', async () => {
      const id = 'mock-id';
      const result = await controller.findOne(id);
      expect(result).toEqual(mockEvoucher);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('getAvailableEvouchers', () => {
    it('should use user._id if present', async () => {
      const req = { user: { _id: 'user-id' } } as any;
      const result = await controller.getAvailableEvouchers(req);
      expect(result).toEqual([mockEvoucher]);
      expect(service.getPublicAvailableEvouchersForUser).toHaveBeenCalledWith('user-id');
    });

    it('should fallback to user.id if _id is not present', async () => {
      const req = { user: { id: 'user-id-alt' } } as any;
      const result = await controller.getAvailableEvouchers(req);
      expect(result).toEqual([mockEvoucher]);
      expect(service.getPublicAvailableEvouchersForUser).toHaveBeenCalledWith('user-id-alt');
    });
  });

  describe('update', () => {
    it('should update an evoucher by id', async () => {
      const id = 'update-id';
      const dto: UpdateEvoucherDto = {
        discount: '15%',
        acronym: 'UPDATE15',
        expiration: new Date(),
      };

      const result = await controller.update(id, dto);
      expect(result).toEqual(mockEvoucher);
      expect(service.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove', () => {
    it('should remove evoucher by id', async () => {
      const id = 'remove-id';
      const result = await controller.remove(id);
      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
