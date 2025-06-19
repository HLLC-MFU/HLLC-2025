import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';

import { CheckinService } from './checkin.service';
import { Checkin } from './schema/checkin.schema';
import { User } from 'src/module/users/schemas/user.schema';
import { Role } from '../role/schemas/role.schema';
import { Activities } from 'src/module/activities/schemas/activities.schema';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { isCheckinAllowed, validateCheckinTime } from './utils/checkin.util';

jest.mock('./utils/checkin.util');

describe('CheckinService', () => {
  let service: CheckinService;
  let userModel: Model<User>;
  let roleModel: Model<Role>;
  let checkinModel: Model<Checkin>;
  let activityModel: Model<Activities>;

  const mockUserModel = {
    findOne: jest.fn(),
  };

  const mockRoleModel = {};

  const mockCheckinModel = {
    find: jest.fn(),
    insertMany: jest.fn(),
  };

  const mockActivityModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckinService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Role.name), useValue: mockRoleModel },
        { provide: getModelToken(Checkin.name), useValue: mockCheckinModel },
        { provide: getModelToken(Activities.name), useValue: mockActivityModel },
      ],
    }).compile();

    service = module.get<CheckinService>(CheckinService);
    userModel = module.get(getModelToken(User.name));
    roleModel = module.get(getModelToken(Role.name));
    checkinModel = module.get(getModelToken(Checkin.name));
    activityModel = module.get(getModelToken(Activities.name));

    jest.clearAllMocks();
  });

  const mockUserId = new Types.ObjectId();
  const mockStaffId = new Types.ObjectId();
  const mockActivityId1 = new Types.ObjectId();
  const mockActivityId2 = new Types.ObjectId();

  describe('create', () => {
    describe('validation errors', () => {
      it('should throw if username is invalid', async () => {
        await expect(
          service.create({ username: null, activities: [] } as any),
        ).rejects.toThrow(new BadRequestException('Invalid username'));
      });

      it('should throw if user not found', async () => {
        mockUserModel.findOne.mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(null),
        });

        await expect(
          service.create({
            user: 'someone',
            activities: ['a'],
          } as unknown as CreateCheckinDto),
        ).rejects.toThrow(new BadRequestException('User not found'));
      });

      it('should throw if activities array is empty', async () => {
        mockUserModel.findOne.mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ _id: mockUserId }),
        });

        await expect(
          service.create({
            user: 'user',
            activities: [],
          } as unknown as CreateCheckinDto),
        ).rejects.toThrow(new BadRequestException('Activities must be a non-empty array'));
      });

      it('should throw if invalid staff ID is provided', async () => {
        mockUserModel.findOne.mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ _id: mockUserId }),
        });

        await expect(
          service.create({
            user: 'user',
            activities: ['a'],
            staff: 'invalid_id',
          } as unknown as CreateCheckinDto),
        ).rejects.toThrow(/input must be a 24 character hex string/);
      });
    });

    describe('business logic', () => {
      it('should throw if staff is not allowed to checkin user', async () => {
        mockUserModel.findOne.mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ _id: mockUserId }),
        });

        jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
        (isCheckinAllowed as jest.Mock).mockResolvedValueOnce(false);
        (validateCheckinTime as jest.Mock).mockResolvedValue(undefined);

        await expect(
          service.create({
            user: 'user',
            staff: mockStaffId.toHexString(),
            activities: ['a'],
          } as unknown as CreateCheckinDto),
        ).rejects.toThrow(new BadRequestException('User is not allowed to be checked in by this staff'));
      });

      it('should throw if user already checked into all activities', async () => {
        mockUserModel.findOne.mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ _id: mockUserId }),
        });

        jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
        (isCheckinAllowed as jest.Mock).mockResolvedValue(true);
        (validateCheckinTime as jest.Mock).mockResolvedValue(undefined);

        mockCheckinModel.find.mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { activity: mockActivityId1 },
            { activity: mockActivityId2 },
          ]),
        });

        await expect(
          service.create({
            user: 'user',
            staff: mockStaffId.toHexString(),
            activities: [
              mockActivityId1.toHexString(),
              mockActivityId2.toHexString(),
            ],
          } as unknown as CreateCheckinDto),
        ).rejects.toThrow(new BadRequestException('User already checked in to all activities'));
      });

      it('should insert new checkins successfully', async () => {
        mockUserModel.findOne.mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ _id: mockUserId }),
        });

        jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
        (isCheckinAllowed as jest.Mock).mockResolvedValue(true);
        (validateCheckinTime as jest.Mock).mockResolvedValue(undefined);

        mockCheckinModel.find.mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([]),
        });

        const inserted = [
          { user: mockUserId, activity: mockActivityId1, staff: mockStaffId },
          { user: mockUserId, activity: mockActivityId2, staff: mockStaffId },
        ];

        mockCheckinModel.insertMany.mockResolvedValue(inserted);

        const result = await service.create({
          user: 'user',
          staff: mockStaffId.toHexString(),
          activities: [
            mockActivityId1.toHexString(),
            mockActivityId2.toHexString(),
          ],
        } as unknown as CreateCheckinDto);

        expect(result).toEqual(inserted);
        expect(mockCheckinModel.insertMany).toHaveBeenCalledWith([
          { user: mockUserId, activity: mockActivityId1, staff: mockStaffId },
          { user: mockUserId, activity: mockActivityId2, staff: mockStaffId },
        ]);
      });
    });
  });
});