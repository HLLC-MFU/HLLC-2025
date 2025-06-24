import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  queryDeleteOne,
  queryAll,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { Major, MajorDocument } from '../majors/schemas/major.schema';

import { UpdateUserDto } from './dto/update-user.dto';
import { validateMetadataSchema } from 'src/pkg/helper/validateMetadataSchema';
import { UserUploadDirectDto } from './dto/upload.user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Major.name)
    private readonly majorModel: Model<MajorDocument>,
  ) {}

  /**
   * Creates a new user.
   * @param createUserDto - The data to create a new user.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const role = await this.roleModel.findById(createUserDto.role).lean();

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    validateMetadataSchema(createUserDto.metadata, role.metadataSchema);

    const newUser = new this.userModel({
      ...createUserDto,
      role: new Types.ObjectId(createUserDto.role),
      metadata: createUserDto.metadata,
    });

    return await newUser.save();
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<User>({
      model: this.userModel,
      query: {
        ...query,
        excluded: 'password,refreshToken,role.permissions,role.metadataSchema',
      },
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          { path: 'role' },
          {
            path: 'metadata.major',
            model: 'Major',
            populate: {
              path: 'school',
            },
          },
        ]),
    });
  }

  async findOne(_id: string) {
    return queryFindOne<User>(this.userModel, { _id }, []);
  }

  async getUserCountByRoles(): Promise<
    Record<string, { registered: number; notRegistered: number }>
  > {
    const pipeline = [
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleData',
        },
      },
      { $unwind: '$roleData' },
      {
        $addFields: {
          isRegistered: {
            $cond: [
              {
                $or: [
                  { $eq: ['$password', ''] },
                  { $not: ['$password'] },
                  { $eq: ['$password', null] },
                ],
              },
              false,
              true,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$roleData.name',
          registered: {
            $sum: { $cond: [{ $eq: ['$isRegistered', true] }, 1, 0] },
          },
          notRegistered: {
            $sum: { $cond: [{ $eq: ['$isRegistered', false] }, 1, 0] },
          },
        },
      },
    ];

    type AggregationResult = {
      _id: string;
      registered: number;
      notRegistered: number;
      total: number;
    };

    const result = (await this.userModel
      .aggregate(pipeline)
      .exec()) as AggregationResult[];

    // Format output
    return result.reduce<
      Record<
        string,
        { registered: number; notRegistered: number; total: number }
      >
    >((acc, curr) => {
      acc[curr._id] = {
        registered: curr.registered,
        notRegistered: curr.notRegistered,
        total: curr.registered + curr.notRegistered,
      };
      return acc;
    }, {});
  }

  /**
   *
   * @param query
   * @returns
   * example: this.usersService.findOneByQuery({ username });
   */
  async findOneByQuery(query: Partial<User> & { _id?: string }) {
    return queryFindOne<User>(this.userModel, query, [
      {
        path: 'role',
      },
      {
        path: 'metadata.major',
        model: 'Major',
        populate: {
          path: 'school',
          model: 'School',
        },
      },
    ]);
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleModel.findById(user.role).lean();
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (updateUserDto.metadata) {
      validateMetadataSchema(updateUserDto.metadata, role.metadataSchema);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateUserDto }, { new: true })
      .lean();

    return updatedUser as User;
  }

  async remove(id: string): Promise<void> {
    await queryDeleteOne<User>(this.userModel, id);
  }

  async removeMultiple(ids: string[]): Promise<User[]> {
    try {
      const users = await this.userModel.find({ _id: { $in: ids } }).lean();
      await this.userModel.deleteMany({ _id: { $in: ids } });
      return users;
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  async resetPassword(id: string) {
    const user = await findOrThrow(this.userModel, id, 'User not found');
    user.password = '';
    user.refreshToken = null;
    await user.save();
  }

  /**
   * Uploads multiple users from a DTO.
   * @param uploadUserDto - The DTO containing user data to upload.
   * @returns An array of created User objects.
   */
  async upload(uploadUserDtos: UserUploadDirectDto[]): Promise<User[]> {
    const users = await Promise.all(
      uploadUserDtos.map(async (userDto) => {
        const userMajor = userDto.metadata?.major;
        if (!userMajor) {
          throw new BadRequestException('Major is required');
        }

        const userMajorRecord = await this.majorModel
          .findById(userMajor)
          .lean();
        if (!userMajorRecord) {
          throw new NotFoundException('Major in database not found');
        }

        return {
          name: {
            first: userDto.name.first,
            middle: userDto.name.middle || '',
            last: userDto.name.last || '',
          },
          username: userDto.username,
          password: '', // password is intentionally blank
          role: new Types.ObjectId(userDto.role),
          metadata: {
            major: userMajor, // ✅ only setting major
            secret: null, // ✅ explicitly set to null
          },
        };
      }),
    );

    try {
      const savedUsers = await Promise.all(
        users.map(async (user) => {
          const userDoc = new this.userModel(user);
          return await userDoc.save();
        }),
      );

      return savedUsers.map((user) => user.toObject());
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async registerDeviceToken(
    id: string,
    registerTokenDto: Record<string, string>,
  ) {
    await findOrThrow(this.userModel, id, 'User not found');

    const token = registerTokenDto.deviceToken;

    return await queryUpdateOne(this.userModel, id, {
      $addToSet: { 'metadata.deviceTokens': token },
    });
  }

  async removeDeviceToken(id: string, deviceToken: string) {
    await findOrThrow(this.userModel, id, 'User not found');

    if (!deviceToken) {
      throw new BadRequestException('Token is required');
    }

    return await queryUpdateOne(this.userModel, id, {
      $pull: { 'metadata.deviceTokens': deviceToken },
    });
  }
}