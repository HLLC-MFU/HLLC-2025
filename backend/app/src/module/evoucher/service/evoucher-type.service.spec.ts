// import { Test, TestingModule } from '@nestjs/testing';
// import { getModelToken } from '@nestjs/mongoose';
// import { EvoucherTypeService } from './evoucher-type.service';
// import { EvoucherType } from '../schema/evoucher-type.schema';
// import { CreateEvoucherTypeDto } from '../dto/evoucher-types/create-evoucher-type.dto';
// import {
//   throwIfExists,
// } from 'src/pkg/validator/model.validator';
// import {
//   handleMongoDuplicateError,
// } from 'src/pkg/helper/helpers';
// import {
//   queryAll,
//   queryFindOne,
//   queryUpdateOne,
//   queryDeleteOne,
// } from 'src/pkg/helper/query.util';

// jest.mock('src/pkg/validator/model.validator', () => ({
//   throwIfExists: jest.fn(),
// }));

// jest.mock('src/pkg/helper/helpers', () => ({
//   handleMongoDuplicateError: jest.fn(),
// }));

// jest.mock('src/pkg/helper/query.util', () => ({
//   queryAll: jest.fn(),
//   queryFindOne: jest.fn(),
//   queryUpdateOne: jest.fn(),
//   queryDeleteOne: jest.fn(),
// }));

// describe('EvoucherTypeService', () => {
//   let service: EvoucherTypeService;

//   const saveMock = jest.fn();
//   const mockModel = jest.fn().mockImplementation(() => ({
//     save: saveMock,
//   }));

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         EvoucherTypeService,
//         {
//           provide: getModelToken(EvoucherType.name),
//           useValue: mockModel,
//         },
//       ],
//     }).compile();

//     service = module.get<EvoucherTypeService>(EvoucherTypeService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('create', () => {
//     it('should create evoucher type successfully', async () => {
//       const dto: CreateEvoucherTypeDto = { name: 'Discount' };

//       (throwIfExists as jest.Mock).mockResolvedValue(undefined);
//       saveMock.mockResolvedValue({ _id: 'id1', ...dto });

//       const result = await service.create(dto);
//       expect(throwIfExists).toHaveBeenCalledWith(expect.anything(), { name: dto.name }, 'Evoucher type already exists');
//       expect(saveMock).toHaveBeenCalled();
//       expect(result).toEqual({ _id: 'id1', name: 'Discount' });
//     });

//     it('should call handleMongoDuplicateError if save fails', async () => {
//       const dto: CreateEvoucherTypeDto = { name: 'Duplicate' };

//       (throwIfExists as jest.Mock).mockResolvedValue(undefined);
//       const error = new Error('duplicate key');
//       saveMock.mockRejectedValue(error);

//       await service.create(dto);
//       expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'name');
//     });

//     it('should throw if name already exists', async () => {
//       const dto: CreateEvoucherTypeDto = { name: 'Exists' };

//       (throwIfExists as jest.Mock).mockRejectedValue(new Error('Evoucher type already exists'));

//       await expect(service.create(dto)).rejects.toThrow('Evoucher type already exists');
//       expect(throwIfExists).toHaveBeenCalled();
//     });
//   });

//   describe('findAll', () => {
//     it('should return all evoucher types', async () => {
//       const mockData = { data: ['type1'], meta: {} };
//       (queryAll as jest.Mock).mockResolvedValue(mockData);

//       const result = await service.findAll({});
//       expect(queryAll).toHaveBeenCalledWith({
//         model: expect.anything(),
//         query: {},
//         filterSchema: {},
//       });
//       expect(result).toEqual(mockData);
//     });
//   });

//   describe('findOne', () => {
//     it('should return one evoucher type', async () => {
//       (queryFindOne as jest.Mock).mockResolvedValue({ _id: 'abc', name: 'Food' });

//       const result = await service.findOne('abc');
//       expect(queryFindOne).toHaveBeenCalledWith(expect.anything(), { _id: 'abc' });
//       expect(result).toEqual({ _id: 'abc', name: 'Food' });
//     });
//   });

//   describe('update', () => {
//     it('should update evoucher type', async () => {
//       const updateDto = { name: 'Updated' };
//       (queryUpdateOne as jest.Mock).mockResolvedValue({ _id: '123', name: 'Updated' });

//       const result = await service.update('123', updateDto);
//       expect(queryUpdateOne).toHaveBeenCalledWith(expect.anything(), '123', updateDto);
//       expect(result).toEqual({ _id: '123', name: 'Updated' });
//     });
//   });

//   describe('remove', () => {
//     it('should delete evoucher type', async () => {
//       (queryDeleteOne as jest.Mock).mockResolvedValue(true);

//       const result = await service.remove('999');
//       expect(queryDeleteOne).toHaveBeenCalledWith(expect.anything(), '999');
//       expect(result).toEqual({
//         message: 'Evoucher type deleted successfully',
//         id: '999',
//       });
//     });
//   });
// });
