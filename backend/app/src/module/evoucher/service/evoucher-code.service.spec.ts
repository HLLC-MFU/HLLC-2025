// import { Test, TestingModule } from '@nestjs/testing';
// import { getModelToken } from '@nestjs/mongoose';
// import { EvoucherCodeService } from './evoucher-code.service';
// import { EvoucherCode, EvoucherCodeDocument } from '../schema/evoucher-code.schema';
// import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';
// import { User, UserDocument } from 'src/module/users/schemas/user.schema';
// import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
// import { Types, Model } from 'mongoose';

// import { findOrThrow } from 'src/pkg/validator/model.validator';
// import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
// import {
//   queryAll,
//   queryDeleteOne,
//   queryFindOne,
//   queryUpdateOne,
// } from 'src/pkg/helper/query.util';
// import { BadRequestException } from '@nestjs/common';

// jest.mock('src/pkg/validator/model.validator', () => ({ findOrThrow: jest.fn() }));
// jest.mock('src/pkg/helper/helpers', () => ({ handleMongoDuplicateError: jest.fn() }));
// jest.mock('src/pkg/helper/query.util', () => ({
//   queryAll: jest.fn(),
//   queryDeleteOne: jest.fn(),
//   queryFindOne: jest.fn(),
//   queryUpdateOne: jest.fn(),
// }));

// describe('EvoucherCodeService', () => {
//   let service: EvoucherCodeService;
//   let evoucherCodeModel: Partial<Record<keyof Model<EvoucherCodeDocument>, jest.Mock>> & {
//     findById: jest.Mock;
//     find: jest.Mock;
//     exists: jest.Mock;
//     findOne: jest.Mock;
//     insertMany: jest.Mock;
//   };
//   let evoucherModel: Partial<Record<keyof Model<EvoucherDocument>, jest.Mock>>;
//   let userModel: Partial<Record<keyof Model<UserDocument>, jest.Mock>>;

//   beforeEach(async () => {
//     evoucherCodeModel = {
//       findById: jest.fn(),
//       find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
//       exists: jest.fn(),
//       findOne: jest.fn(),
//       insertMany: jest.fn(),
//     };
//     evoucherModel = {
//       find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
//     };
//     userModel = {};

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         EvoucherCodeService,
//         { provide: getModelToken(EvoucherCode.name), useValue: evoucherCodeModel },
//         { provide: getModelToken(Evoucher.name), useValue: evoucherModel },
//         { provide: getModelToken(User.name), useValue: userModel },
//       ],
//     }).compile();

//     service = module.get<EvoucherCodeService>(EvoucherCodeService);
//   });

//   afterEach(() => jest.clearAllMocks());

//   describe('create', () => {
//     it('should create evoucher code', async () => {
//       const dto: CreateEvoucherCodeDto = {
//         evoucher: 'Chongko',
//         user: new Types.ObjectId().toString(),
//         isUsed:false,
//         metadata:{},
//       };

//       const evoucher = { expiration: new Date(Date.now() + 100000), acronym: 'EV' };
//       (findOrThrow as jest.Mock).mockResolvedValueOnce(evoucher).mockResolvedValueOnce({});
//       const generateNextCode = jest.spyOn(service as EvoucherCodeService, 'generateNextCode' as any);
//       generateNextCode.mockResolvedValue('EV000001');
//       const saveMock = jest.fn().mockResolvedValue({ code: 'EV000001' });
//       const evoucherCodeConstructor = jest.fn().mockImplementation(() => ({ save: saveMock }));
//       Object.defineProperty(service, 'evoucherCodeModel', { value: evoucherCodeConstructor });

//       const result = await service.create(dto);
//       expect(result).toEqual({ code: 'EV000001' });
//     });

//     it('should throw if evoucher expired', async () => {
//       const dto = { evoucher: '1', user: '2' } as CreateEvoucherCodeDto;
//       (findOrThrow as jest.Mock).mockResolvedValueOnce({ expiration: new Date(Date.now() - 1000) });
//       await expect(service.create(dto)).rejects.toThrow('Cannot create code for expired evoucher');
//     });

//     it('should call handleMongoDuplicateError if save fails', async () => {
//       const dto = { evoucher: '1', user: '2' } as CreateEvoucherCodeDto;
//       (findOrThrow as jest.Mock).mockResolvedValue({ expiration: new Date(Date.now() + 1000), acronym: 'EV' });
//       const generateNextCode = jest.spyOn(service as EvoucherCodeService, 'generateNextCode' as any);
//       generateNextCode.mockResolvedValue('EV000001');
//       const saveMock = jest.fn().mockRejectedValue(new Error('dup'));
//       const evoucherCodeConstructor = jest.fn().mockImplementation(() => ({ save: saveMock }));
//       Object.defineProperty(service, 'evoucherCodeModel', { value: evoucherCodeConstructor });

//       await service.create(dto);
//       expect(handleMongoDuplicateError).toHaveBeenCalledWith(expect.any(Error), 'code');
//     });
//   });

//   describe('findAll', () => {
//     it('should call queryAll with populateFields', async () => {
//       (queryAll as jest.Mock).mockResolvedValue({ data: [], meta: {} });
//       const result = await service.findAll({});
//       expect(result).toEqual({ data: [], meta: {} });
//     });
//   });

//   describe('findOne', () => {
//     it('should call queryFindOne', async () => {
//       (queryFindOne as jest.Mock).mockResolvedValue({ code: 'C1' });
//       const result = await service.findOne('1');
//       expect(result).toEqual({ code: 'C1' });
//     });
//   });

//   describe('findOneByQuery', () => {
//     it('should return one by query', async () => {
//       (queryFindOne as jest.Mock).mockResolvedValue({ code: 'X' });
//       const result = await service.findOneByQuery({ code: 'X' });
//       expect(result).toEqual({ code: 'X' });
//     });
//   });

//   describe('findAllByQuery', () => {
//     it('should return many by query', async () => {
//       (queryAll as jest.Mock).mockResolvedValue({ data: ['X'], meta: {} });
//       const result = await service.findAllByQuery({ isUsed: false });
//       expect(result).toEqual({ data: ['X'], meta: {} });
//     });
//   });

//   describe('remove', () => {
//     it('should delete code', async () => {
//       (queryDeleteOne as jest.Mock).mockResolvedValue(true);
//       const result = await service.remove('1');
//       expect(result).toEqual({ message: 'Evoucher code deleted successfully', id: '1' });
//     });
//   });

//   describe('checkVoucherUsage', () => {
//     it('should return true if used', async () => {
//       evoucherCodeModel.findOne!.mockResolvedValue({ code: 'ABC' });
//       const result = await service.checkVoucherUsage('u1', 'e1');
//       expect(result).toBe(true);
//     });

//     it('should return false if not used', async () => {
//       evoucherCodeModel.findOne!.mockResolvedValue(null);
//       const result = await service.checkVoucherUsage('u1', 'e1');
//       expect(result).toBe(false);
//     });
//   });
// });