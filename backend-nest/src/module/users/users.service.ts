import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { userMetadataValidator } from '../../pkg/validator/userMetadata.validator';
import { throwIfExists, findOrThrow } from '../../pkg/validator/model.validator';
import * as bcrypt from 'bcryptjs';
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    await throwIfExists(this.userModel, { username: createUserDto.username }, 'Username already exists');

    const role = await findOrThrow(this.roleModel, createUserDto.role, 'Role');

    if (role.metadataSchema) {
      userMetadataValidator(createUserDto.metadata || {}, role.metadataSchema);
    }

    const user = new this.userModel({
      ...createUserDto,
      role: new Types.ObjectId(createUserDto.role),
    });

    return user.save();
  }

  async findAll(
    filters: Record<string, any> = {},
    page = 1,
    limit?: number, // ❗ limit เป็น optional
    excluded: string[] = [],
  ) {
    const query = this.userModel.find(filters);

    const populateFields: { path: string; model?: string }[] = [];

    if (!excluded.includes('role')) {
      populateFields.push({ path: 'role' });
    }

    const sampleUser = await this.userModel.findOne().lean();
    if (sampleUser?.metadata?.major && !excluded.includes('major')) {
      populateFields.push({ path: 'metadata.major', model: 'Major' });
    }

    populateFields.forEach((field) => query.populate(field));

    if (limit !== undefined && limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }

    const [data, total, latest] = await Promise.all([
      query.lean(),
      this.userModel.countDocuments(filters),
      this.userModel.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean() as { updatedAt?: Date },
    ]);

    const lastUpdatedAt = latest?.updatedAt?.toISOString() ?? new Date().toISOString();

    return buildPaginatedResponse(data, {
      total,
      page,
      limit: limit ?? total, // ถ้าไม่ส่ง limit มา → limit = total
      lastUpdatedAt,
    });
  }


  async findOne(idOrFilters: string | FilterQuery<UserDocument>): Promise<User> {
    if (typeof idOrFilters === 'string') {
      return findOrThrow(this.userModel, idOrFilters, 'User');
    }

    const user = await this.userModel.findOne(idOrFilters).populate('role').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await findOrThrow(this.userModel, id, 'User');
    const role = await findOrThrow(this.roleModel, updateUserDto.role ?? user.role, 'Role');

    if (role.metadataSchema) {
      userMetadataValidator(updateUserDto.metadata || {}, role.metadataSchema);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    await user.save();

    return findOrThrow(this.userModel.findById(id).populate('role'), id, 'User');
  }

  async remove(id: string): Promise<void> {
    await findOrThrow(this.userModel, id, 'User');
    await this.userModel.findByIdAndDelete(id);
  }
}