import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  queryDeleteOne,
  queryAll,
  queryFindOne,
} from 'src/pkg/helper/query.util';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import { UploadUserDto } from './dto/upload.user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { validateMetadataSchema } from 'src/pkg/helper/validateMetadataSchema';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

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
      metadata: createUserDto.metadata,
    });

    try {
      return await newUser.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'username');
    }
  }

  async findAll(query: Record<string, any>) {
    return await queryAll<User>({
      model: this.userModel,
      query,
      filterSchema: {},
      buildPopulateFields: (excluded) =>
        Promise.resolve(excluded.includes('role') ? [] : [{ path: 'role' }]),
    });
  }

  async findOne(_id: string) {
    return queryFindOne<User>(this.userModel, { _id }, []);
  }

  async getUserCountByRoles(): Promise<Record<string, number>> {
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
        $group: {
          _id: '$roleData.name',
          count: { $sum: 1 },
        },
      },
    ];
    console.log('Pipeline:', JSON.stringify(pipeline, null, 2));
    const result = (await this.userModel.aggregate(pipeline).exec()) as {
      _id: string;
      count: number;
    }[];

    return result.reduce<Record<string, number>>((acc, curr) => {
      acc[curr._id] = curr.count;
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

  /**
   * Find all users with optional filtering by school or major
   * @param query Query parameters that can include school ID or other user fields
   * @returns List of users with populated role, major, and school information
   * example: this.usersService.findAllByQuery({ school: '...' });
   * example: this.usersService.findAllByQuery({ metadata: { major: '...' } });
   */
  async findAllByQuery(query: Partial<User> & { school?: string }) {
    const q: any = { ...query };
  
    if (q.school) {
      console.log('Searching for school:', q.school);
      const majors = await this.majorModel
        .find({ school: new Types.ObjectId(q.school) })
        .select('_id')
        .lean();
  
      console.log('Found majors:', majors);
      const majorIds = majors.map((m) => m._id.toString());
      console.log('Major IDs:', majorIds);
      
      q['metadata.major'] = { $in: majorIds };
      delete q.school;
    }
  
    console.log('Final query:', JSON.stringify(q, null, 2));
  
    return queryAll<User>({
      model: this.userModel,
      query: q,
      select: 'username name role metadata.major',
      filterSchema: {},
      buildPopulateFields: () => Promise.resolve([]), // ถ้าไม่ต้อง populate อะไร
    });
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

  async remove(id: string) {
    await queryDeleteOne<User>(this.userModel, id);
    return {
      message: 'User deleted successfully',
      id,
    };
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

  async upload(uploadUserDto: UploadUserDto): Promise<User[]> {
    const users: CreateUserDto[] = await Promise.all(
      uploadUserDto.users.map(async (userDto) => {
        const userMajor = userDto.major || uploadUserDto.major;

        // ✅ Check major existence
        if (userDto.major) {
          const userMajorRecord = await this.majorModel
            .findById(userDto.major)
            .lean();
          if (!userMajorRecord) {
            throw new NotFoundException('Major in database not found');
          }
        }

        return {
          name: {
            first: userDto.name.first,
            last: userDto.name.last || '',
          },
          fullName: `${userDto.name.first} ${userDto.name.last || ''}`,
          username: userDto.studentId,
          password: '', // initially blank
          secret: '', // initially blank
          major: new Types.ObjectId(userMajor),
          role: new Types.ObjectId(uploadUserDto.role),
          metadata: {
            type: uploadUserDto.metadata?.type ?? null,
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
      if (error.code === 11000) {
        throw new ConflictException('Username already exists');
      }
      throw error;
    }
  }

  // async getUserScopeIds(userId: string) {
  //   const user = await this.userModel.findById(userId).lean();
  //   if (!user) return null;

  //   const majorId = user.metadata?.major;
  //   let schoolId: string | undefined = undefined;

  //   if (majorId) {
  //     const major = await this.majorModel.findById(majorId).lean();
  //     schoolId = major?.school?.toString();
  //   }

  //   return {
  //     userId: user._id.toString(),
  //     majorId: majorId?.toString(),
  //     schoolId,
  //     role: user.role?.toString(),
  //   };
  // }
  
  
  
}
