import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { encryptItem } from '../auth/utils/crypto';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) { }

  /**
   * Creates a new role.
   * permissions are encrypted before saving.
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = new this.roleModel({
      name: createRoleDto.name,
      metadataSchema: createRoleDto.metadataSchema,
      permissions: createRoleDto.permissions?.map(encryptItem) || [],
    });

    try {
      return await role.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  /**
   * Finds a role by name.
   * Throws an error if the role already exists.
   */
  async findAll(): Promise<Role[]> {
    return this.roleModel.find().lean();
  }

  /**
   * Finds a role by ID.
   * Throws an error if the role does not exist.
   */
  async findOne(id: string): Promise<Role> {
    return findOrThrow(this.roleModel, id, 'Role');
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');

    if (updateRoleDto.permissions && Array.isArray(updateRoleDto.permissions)) {
      role.permissions = updateRoleDto.permissions.map((perm) =>
        encryptItem(perm),
      );
    }

    if (updateRoleDto.name) {
      role.name = updateRoleDto.name;
    }
    if (updateRoleDto.metadataSchema) {
      role.metadataSchema = updateRoleDto.metadataSchema;
    }

    try {
      return await role.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  async remove(id: string) {
    await findOrThrow(this.roleModel, id, 'Role');
    await this.roleModel.findByIdAndDelete(id);

    return {
      message: 'Role deleted successfully',
      id,
    };
  }

  async updateMetadataSchema(
    id: string,
    dto: UpdateMetadataSchemaDto,
  ): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');
    role.metadataSchema = dto.metadataSchema;
    try {
      return await role.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }
}
