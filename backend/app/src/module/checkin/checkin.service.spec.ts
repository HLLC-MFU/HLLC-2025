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
  it('should throw if user is not found', async () => {
    mockUserModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    const dto: CreateCheckinDto = {
      user: 'someone',
      activities: [mockActivityId1.toHexString(), mockActivityId2.toHexString()],  // <-- แก้ตรงนี้
      staff: mockStaffId.toHexString(),
    };

    await expect(service.create(dto)).rejects.toThrow(
      new BadRequestException('User not found')
    );
  });

  it('should throw if activities is empty', async () => {
    mockUserModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ _id: mockUserId }),
    });

    const dto: CreateCheckinDto = {
      user: 'user',
      activities: [],  
      staff: mockStaffId.toHexString(),
    };

    await expect(service.create(dto)).rejects.toThrow(
      new BadRequestException('Activities must be a non-empty array')
    );
  });

  it('should throw if staff is not allowed to checkin', async () => {
    mockUserModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ _id: mockUserId }),
    });

    jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
    (isCheckinAllowed as jest.Mock).mockResolvedValueOnce(false);
    (validateCheckinTime as jest.Mock).mockResolvedValue(undefined);

    const dto: CreateCheckinDto = {
      user: 'user',
      staff: mockStaffId.toHexString(),
      activities: [mockActivityId1.toHexString(), mockActivityId2.toHexString()],  
    };

    await expect(service.create(dto)).rejects.toThrow(
      new BadRequestException('User is not allowed to be checked in by this staff')
    );
  });

  it('should insert new checkins', async () => {
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

    const dto: CreateCheckinDto = {
      user: 'user',
      staff: mockStaffId.toHexString(),
      activities: [mockActivityId1.toHexString(), mockActivityId2.toHexString()], // รวมเป็น string เดียว
    };

    const result = await service.create(dto);

    expect(result).toEqual(inserted);
    expect(mockCheckinModel.insertMany).toHaveBeenCalled();
  });
});

});