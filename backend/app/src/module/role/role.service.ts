import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { Checkin, CheckinDocument } from '../checkin/schema/checkin.schema';

/**
 * @class RoleService
 * @description
 * RoleService provides methods to manage roles in the system.
 * It includes **creating**, **updating**, **deleting**, and **retrieving** roles.
 * Permissions are **encrypted** before saving and **decrypted** when retrieving.
 *
 * ⚠️ **IF YOU EDIT THIS FILE WITHOUT JEMIEZLER'S APPROVAL, I WILL HUNT YOU DOWN.**
 *
 * @author
 * **NATTAWAT NATTACHANASIT**
 */

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,
  ) {}

  /**
   * Creates a new role.
   * permissions are encrypted before saving.
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = new this.roleModel({
      name: createRoleDto.name,
      metadataSchema: createRoleDto.metadataSchema,
      metadata: createRoleDto.metadata,
      permissions: createRoleDto.permissions || [],
    });
    return await role.save();
  }

  /**
   * Finds all roles.
   */
  async findAll(): Promise<Role[]> {
    const roles = await this.roleModel.find().lean();
    return roles;
  }

  /**
   * Finds a role by ID.
   * Throws an error if the role does not exist.
   */
  async findOne(id: string): Promise<Role> {
    return findOrThrow(this.roleModel, id, 'Role');
  }

  /**
   * Finds a role by name.
   */
  async findByName(name: string): Promise<Role | null> {
    return this.roleModel.findOne({ name }).lean();
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');

    if (updateRoleDto.name) {
      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.metadataSchema) {
      role.metadataSchema = updateRoleDto.metadataSchema;
    }

    if (updateRoleDto.metadata) {
      role.metadata = updateRoleDto.metadata;
    }

    return await role.save();
  }

  async remove(id: string) {
    await this.roleModel.findByIdAndDelete(id);

    return {
      message: 'Role deleted successfully',
      id,
    };
  }

  async updatePermissions(id: string, permissions: string[]): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');

    role.permissions = permissions;

    return await role.save();
  }

  async updateMetadataSchema(
    id: string,
    dto: UpdateMetadataSchemaDto,
  ): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');
    role.metadataSchema = dto.metadataSchema;
    return await role.save();
  }

  /**
   * Updates the check-in scope for a role.
   * @param roleId The ID of the role to update.
   * @param config The configuration for the check-in scope.
   * @returns The updated role.
   */
  async updateCheckinScope(
    roleId: string,
    users?: string[],
    majors?: string[],
    schools?: string[],
  ): Promise<Role> {
    if (!Types.ObjectId.isValid(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }

    const role = await this.roleModel.findById(roleId);
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    role.metadata ??= {};
    role.metadata.canCheckin = {
      users: users ?? [],
      majors: majors ?? [],
      schools: schools ?? [],
    };

    return await role.save();
  }
}
