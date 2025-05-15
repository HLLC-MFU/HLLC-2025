import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    await throwIfExists(this.roleModel, { name: createRoleDto.name }, 'Role name already exists');
    return this.roleModel.create(createRoleDto);
  }
  

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().lean();
  }

  async findOne(id: string): Promise<Role> {
    return findOrThrow(this.roleModel, id, 'Role');
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');
    Object.assign(role, updateRoleDto);
    return role.save();
  }

  async remove(id: string): Promise<void> {
    await findOrThrow(this.roleModel, id, 'Role');
    await this.roleModel.findByIdAndDelete(id);
  }

  async updateMetadataSchema(
    id: string,
    dto: UpdateMetadataSchemaDto
  ): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');
    role.metadataSchema = dto.metadataSchema;
    return role.save();
  }
}
