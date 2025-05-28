import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  queryDeleteOne,
  queryUpdateOne,
  queryAll,
  queryFindOne,
} from 'src/pkg/helper/query.util';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import { UserUploadDirectDto } from './dto/upload.user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { validateMetadataSchema } from 'src/pkg/helper/validateMetadataSchema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Major.name)
    private readonly majorModel: Model<MajorDocument>,
  ) { }

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

    return await newUser.save();
  }

  async findAll(query: Record<string, any>) {
    return await queryAll<User>({
      model: this.userModel,
      query,
      filterSchema: {},
      buildPopulateFields: excluded =>
        Promise.resolve(excluded.includes('role') ? [] : [{ path: 'role' }]),
    });
  }

  async findOne(_id: string) {
    return queryFindOne<User>(this.userModel, { _id }, []);
  }

  /**
   * 
   * @param query 
   * @returns 
   * example: this.usersService.findOneByQuery({ username });
   */
  async findOneByQuery(query: Partial<User> & { _id?: string }) {
    return queryFindOne<User>(this.userModel, query, [{
      path: 'role',
    }, {
      path: 'metadata.major', model: 'Major'
    }]);
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

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateUserDto },
      { new: true },
    ).lean();

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

  // src/module/users/users.service.ts
  async upload(usersDto: UserUploadDirectDto[]): Promise<User[]> {
    const users: CreateUserDto[] = await Promise.all(
      usersDto.map(async (userDto) => {
        const userMajorId = userDto.metadata?.major?._id;

        if (userMajorId) {
          const majorRecord = await this.majorModel.findById(userMajorId).lean();
          if (!majorRecord) {
            throw new NotFoundException('Major in database not found');
          }
        }

        const createUser: CreateUserDto = {
          name: {
            first: userDto.name.first,
            last: userDto.name.last || '',
          },
          fullName: `${userDto.name.first} ${userDto.name.last || ''}`,
          username: userDto.username,
          password: userDto.password ?? '',
          secret: '',
          ...(userMajorId && { major: new Types.ObjectId(userMajorId) }),
          role: new Types.ObjectId(userDto.role),
          metadata: userDto.metadata ?? {},
        };
        return createUser;
      }),
    );

    try {
      const savedUsers = await Promise.all(
        users.map(async (user) => {
          const userDoc = new this.userModel(user);
          return await userDoc.save();
        }),
      );

      // Safer conversion: only if toObject exists
      return savedUsers.map((user) =>
        typeof user.toObject === "function" ? user.toObject() : user
      );
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Username already exists');
      }
      throw error;
    }
  }


}
