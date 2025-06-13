// import { Test, TestingModule } from '@nestjs/testing';
// import { getModelToken } from '@nestjs/mongoose';
// import { CheckinService } from './checkin.service';
// import { Checkin, CheckinDocument } from './schema/checkin.schema';
// import { User, UserDocument } from '../users/schemas/user.schema';
// import { Activities, ActivityDocument } from '../activities/schema/activities.schema';
// import { CreateCheckinDto } from './dto/create-checkin.dto';
// import { UpdateCheckinDto } from './dto/update-checkin.dto';
// import { Types, Model } from 'mongoose';
// import { findOrThrow } from 'src/pkg/validator/model.validator';
// import {
//   queryAll,
//   queryDeleteOne,
//   queryFindOne,
//   queryUpdateOne,
// } from 'src/pkg/helper/query.util';

// jest.mock('src/pkg/validator/model.validator', () => ({ findOrThrow: jest.fn() }));
// jest.mock('src/pkg/helper/query.util', () => ({
//   queryAll: jest.fn(),
//   queryDeleteOne: jest.fn(),
//   queryFindOne: jest.fn(),
//   queryUpdateOne: jest.fn(),
// }));

// describe('CheckinService', () => {
//   let service: CheckinService;
//   let checkinModel: Pick<Model<CheckinDocument>, 'findByIdAndDelete'>;
//   let userModel: Partial<Model<UserDocument>>;
//   let activitiesModel: Partial<Model<ActivityDocument>>;

//   beforeEach(async () => {
//     checkinModel = {
//       findByIdAndDelete: jest.fn(),
//     };

//     userModel = {};
//     activitiesModel = {};

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         CheckinService,
//         { provide: getModelToken(Checkin.name), useValue: checkinModel },
//         { provide: getModelToken(User.name), useValue: userModel },
//         { provide: getModelToken(Activities.name), useValue: activitiesModel },
//       ],
//     }).compile();

//     service = module.get<CheckinService>(CheckinService);
//   });

//   afterEach(() => jest.clearAllMocks());

//   describe('create', () => {
//     const dto: CreateCheckinDto = {
//       user: new Types.ObjectId().toString(),
//       staff: new Types.ObjectId().toString(),
//       activities: [new Types.ObjectId().toString()],
//     };

//     it('should create checkin successfully', async () => {
//       (findOrThrow as jest.Mock).mockResolvedValue({});

//       const saveMock = jest.fn().mockResolvedValue({ _id: 'checkin1', ...dto });
//       const modelConstructor = jest.fn().mockImplementation(() => ({ save: saveMock }));
//       Object.defineProperty(service, 'checkinModel', { value: modelConstructor });

//       const result = await service.create(dto);
//       expect(saveMock).toHaveBeenCalled();
//       expect(result && '_id' in result && result._id).toBe('checkin1');
//     });

//     it('should throw if user not found', async () => {
//       (findOrThrow as jest.Mock).mockRejectedValueOnce(new Error('User not found'));
//       await expect(service.create(dto)).rejects.toThrow('User not found');
//     });

//     it('should throw if activity not found', async () => {
//       (findOrThrow as jest.Mock)
//         .mockResolvedValueOnce({}) // user
//         .mockResolvedValueOnce({}) // staff
//         .mockRejectedValueOnce(new Error('Activity not found'));

//       await expect(service.create(dto)).rejects.toThrow('Activity not found');
//     });
//   });

//   describe('findAll', () => {
//     it('should return all checkins with populate fields', async () => {
//       (queryAll as jest.Mock).mockResolvedValue({ data: [], meta: {} });
//       const result = await service.findAll({});
//       expect(queryAll).toHaveBeenCalled();
//       expect(result).toEqual({ data: [], meta: {} });
//     });
//   });

//   describe('findOne', () => {
//     it('should return one checkin', async () => {
//       (queryFindOne as jest.Mock).mockResolvedValue({ _id: 'checkin1' });
//       const result = await service.findOne('checkin1');
//       expect(result).toEqual({ _id: 'checkin1' });
//     });
//   });

//   describe('update', () => {
//     const updateDto: UpdateCheckinDto = {
//       user: new Types.ObjectId().toString(),
//       staff: new Types.ObjectId().toString(),
//       activities: [new Types.ObjectId().toString()],
//     };

//     it('should update checkin successfully', async () => {
//       (findOrThrow as jest.Mock).mockResolvedValue({});
//       (queryUpdateOne as jest.Mock).mockResolvedValue({ _id: 'checkin1', ...updateDto });

//       const result = await service.update('checkin1', updateDto);
//       expect(result && '_id' in result && result._id).toBe('checkin1');
//       expect(queryUpdateOne).toHaveBeenCalled();
//     });

//     it('should throw if staff not found', async () => {
//       (findOrThrow as jest.Mock)
//         .mockResolvedValueOnce({})
//         .mockRejectedValueOnce(new Error('Staff not found'));

//       await expect(service.update('checkin1', updateDto)).rejects.toThrow('Staff not found');
//     });
//   });

//   describe('remove', () => {
//     it('should delete checkin successfully', async () => {
//       (findOrThrow as jest.Mock).mockResolvedValue({});
//       (checkinModel.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: 'checkin1' });
//       const result = await service.remove('checkin1');
//       expect(result && '_id' in result && result._id).toBe('checkin1');
//     });
//   });
// });
