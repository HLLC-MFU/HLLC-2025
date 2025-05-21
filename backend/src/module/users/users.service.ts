import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { Major } from '../majors/schemas/major.schema';
import { MajorDocument } from '../majors/schemas/major.schema';

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
      { path: 'metadata.major', model: 'Major' },
    ]);
  }

  async update(id: string, updateData: Partial<User>) {
    return queryUpdateOne<User>(this.userModel, id, updateData);
  }

  async remove(id: string): Promise<void> {
    await queryDeleteOne<User>(this.userModel, id);
  }

  async resetPassword(id: string) {
    const user = await findOrThrow(this.userModel, id, 'User not found')
    user.password = "";
    user.refreshToken = null;
    await user.save();
  }

  // async uploadUsers ()


}
