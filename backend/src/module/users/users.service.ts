import { Inject, Injectable, Logger, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
  queryAll,
} from 'src/pkg/helper/query.util';
import { User, UserDocument } from './schemas/user.schema';
import { Role , RoleDocument } from '../role/schemas/role.schema' 
import { CreateUserDto } from './dto/create-user.dto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { Major ,MajorDocument} from '../majors/schemas/major.schema';
import { UploadUserDto } from './dto/upload.user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Major.name)
    private readonly majorModel: Model<MajorDocument>
  ) {}


  async create(createUserDto: CreateUserDto) {
    await throwIfExists(
      this.userModel,
      { username: createUserDto.username },
      'Username already exists',
    );

    await findOrThrow(this.roleModel, createUserDto.role, 'Role not found');

    await findOrThrow(this.majorModel, createUserDto.major, 'Major not found');


    const user = new this.userModel({
      ...createUserDto,
      role: new Types.ObjectId(createUserDto.role),
      major: new Types.ObjectId(createUserDto.major),
    });

    try {
      return await user.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'username');
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<User>({
      model: this.userModel,
      query,
      filterSchema: {},
      buildPopulateFields: (excluded) =>
        Promise.resolve(excluded.includes('role') ? [] : [{ path: 'role' }]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<User>(this.userModel, { _id: id }, [
      { path: 'role' },
      { path: 'major' },
    ]);
  }

  async findByUsername(username: string) {
    const user = await this.userModel.findOne({ username }).lean();
    try {
      if (!user?.password || user.password.length == 0 || user.password == 'null') {
        throw new BadRequestException("User isn't registered yet")
      }
      return user;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async getMe(id: string) {
    try {
      console.log('🔍 Finding user with ID:', id);
      
      if (!id) {
        throw new UnauthorizedException('User ID is required');
      }

      const user = await this.userModel
        .findById(id)
        .select('-password -refreshToken')
        .populate([
          { path: 'role' },
          { path: 'major' },
        ])
        .lean();
  
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      console.log('✅ Found user:', user);
      return user;
    } catch (error) {
      console.error('❌ Error in getMe:', error);
      if (error.name === 'CastError') {
        throw new UnauthorizedException('Invalid user ID format');
      }
      throw error;
    }
  }
  

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.username) {
      await findOrThrow(this.userModel, { username: updateUserDto.username }, 'Username already exists');
    }
    if (updateUserDto.role) {
      await findOrThrow(this.roleModel, updateUserDto.role, 'Role not found');
    }
    if (updateUserDto.major) {
      await findOrThrow(this.majorModel, updateUserDto.major, 'Major not found');
    }
    return queryUpdateOne<User>(this.userModel, id, updateUserDto);
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
      throw new NotFoundException('Users not found');
    }
  }

  async resetPassword(id: string) {
    const user = await findOrThrow(this.userModel, id, 'User not found')
    user.password = "";
    user.refreshToken = null;
    await user.save();
  }

  async upload(uploadUserDto: UploadUserDto): Promise<User[]> {
    const users: CreateUserDto[] = await Promise.all(
      uploadUserDto.users.map(async (userDto) => {
        const userMajor = userDto.major || uploadUserDto.major;

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
          password: '',
          secret: '',
          major: new Types.ObjectId(userMajor),
          role: new Types.ObjectId(uploadUserDto.role),
          type: uploadUserDto.type,
          round: uploadUserDto.round,
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



}
