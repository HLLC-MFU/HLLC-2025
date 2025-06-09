import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { encryptItem } from '../auth/utils/crypto';

@Injectable()
export class RoleService {
  private readonly SCAN_CONFIG_KEY = 'default';

  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}




  /**
   * Creates a new role.
   * permissions are encrypted before saving.
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const scanConfig = createRoleDto.metadataScanned?.[this.SCAN_CONFIG_KEY];
    if (scanConfig?.canScan && (scanConfig.canScan?.length ?? 0) > 0) {
      await this.validateCanScanRoles(scanConfig.canScan);
    }

    const hasCanScan = (scanConfig?.canScan?.length ?? 0) > 0;
    const defaultScanningMetadata = {
      [this.SCAN_CONFIG_KEY]: {
        scan: hasCanScan,
        canScan: scanConfig?.canScan || [],
      },
    };
    

    const role = new this.roleModel({
      name: createRoleDto.name,
      metadataSchema: createRoleDto.metadataSchema,
      permissions: createRoleDto.permissions?.map(encryptItem) || [],
      metadataScanned: createRoleDto.metadataScanned || defaultScanningMetadata,
    });

    return await role.save();
  }

  /**
   * Finds all roles.
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

  /**
   * Finds a role by name.
   */
  async findByName(name: string): Promise<Role | null> {
    return this.roleModel.findOne({ name }).lean();
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');

    const scanConfig = updateRoleDto.metadataScanned?.[this.SCAN_CONFIG_KEY];
    if (scanConfig?.canScan && scanConfig.canScan.length > 0) {
      await this.validateCanScanRoles(scanConfig.canScan);
    }

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

    if (updateRoleDto.metadataScanned) {
      const currentConfig = role.metadataScanned[this.SCAN_CONFIG_KEY] || { scan: false, canScan: [] };
      const newConfig = updateRoleDto.metadataScanned[this.SCAN_CONFIG_KEY] || {};

      role.metadataScanned = {
        [this.SCAN_CONFIG_KEY]: {
          scan: newConfig.scan ?? currentConfig.scan,
          canScan: newConfig.canScan ?? currentConfig.canScan,
        },
      };
    }

    return await role.save();
  }

  async remove(id: string) {
    const roleToDelete = await this.findOne(id);
    const referencingRoles = await this.roleModel.find({
      [`metadataScanned.${this.SCAN_CONFIG_KEY}.canScan`]: roleToDelete.name,
    });

    if (referencingRoles.length > 0) {
      const roleNames = referencingRoles.map(r => r.name).join(', ');
      throw new BadRequestException(
        `Cannot delete role because it is referenced in canScan by: ${roleNames}`
      );
    }

    await this.roleModel.findByIdAndDelete(id);

    return {
      message: 'Role deleted successfully',
      id,
    };
  }

  async updateMetadataSchema(
    id: string,
    dto: UpdateMetadataSchemaDto,  ): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');
    role.metadataSchema = dto.metadataSchema;
    return await role.save();
  }

  private async validateCanScanRoles(roleNames: string[]): Promise<void> {
    const existingRoles = await this.roleModel
      .find({ name: { $in: roleNames } })
      .select('name')
      .lean();

    const existingRoleNames = existingRoles.map(r => r.name);
    const notFoundRoles = roleNames.filter(name => !existingRoleNames.includes(name));

    if (notFoundRoles.length > 0) {
      throw new BadRequestException(
        `The following roles do not exist: ${notFoundRoles.join(', ')}`
      );
    }
  }

  async canScan(scannerRoleName: string, targetRoleName: string): Promise<boolean> {
    const scannerRole = await this.findByName(scannerRoleName);
    if (!scannerRole) {
      throw new NotFoundException(`Scanner role "${scannerRoleName}" not found`);
    }

    const scanConfig = scannerRole.metadataScanned[this.SCAN_CONFIG_KEY];
    
    if (!scanConfig?.scan) {
      return false;
    }

    const canScanRoles = scanConfig.canScan || [];
    return canScanRoles.includes(targetRoleName);
  }

  async getCanScanRoles(roleName: string): Promise<string[]> {
    const role = await this.findByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }

    const scanConfig = role.metadataScanned[this.SCAN_CONFIG_KEY];
    if (!scanConfig?.scan) {
      return [];
    }

    return scanConfig.canScan || [];
  }
}
