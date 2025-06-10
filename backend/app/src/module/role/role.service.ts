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
        scope: scanConfig?.scope || {},
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
    if (scanConfig?.canScan?.length) {
      await this.validateCanScanRoles(scanConfig.canScan);
    }
  
    if (updateRoleDto.permissions?.length) {
      role.permissions = updateRoleDto.permissions.map(encryptItem);
    }
  
    if (updateRoleDto.name) {
      role.name = updateRoleDto.name;
    }
  
    if (updateRoleDto.metadataSchema) {
      role.metadataSchema = updateRoleDto.metadataSchema;
    }
  
    if (updateRoleDto.metadataScanned) {
      const currentConfig = role.metadataScanned[this.SCAN_CONFIG_KEY] || {
        scan: false,
        canScan: [],
        scope: {
          type: undefined,
          values: [],
        },
      };
      const newConfig = updateRoleDto.metadataScanned[this.SCAN_CONFIG_KEY] || {};
  
      role.metadataScanned = {
        [this.SCAN_CONFIG_KEY]: {
          scan: newConfig.scan ?? currentConfig.scan,
          canScan: newConfig.canScan ?? currentConfig.canScan,
          scope: newConfig.scope ?? currentConfig.scope,
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
    console.log('SCAN CONFIG:', scanConfig);
    console.log('TARGET ROLE:', targetRoleName);
    console.log('SCANNER ROLE:', scannerRoleName);

    if (!scanConfig?.scan) {
      console.log('SCAN CONFIG NOT FOUND');
      return false;
    }

    const canScanRoles = scanConfig.canScan || [];
    console.log('CAN SCAN ROLES:', canScanRoles);
    console.log('TARGET ROLE:', targetRoleName);
    console.log('CAN SCAN ROLES INCLUDES TARGET ROLE:', canScanRoles.includes(targetRoleName));
    return canScanRoles.includes(targetRoleName);
  }

  /**
   * Validates if a scanner role can scan a user based on scope restrictions
   * @param scannerRoleName - Name of the scanner role
   * @param userMajorId - User's major ID
   * @param userSchoolId - User's school ID
   * @returns boolean indicating if scanning is allowed
   */
  async validateScanScope(
    scannerRoleName: string,
    userMajorId?: string,
    userSchoolId?: string,
  ): Promise<boolean> {
    const scannerRole = await this.findByName(scannerRoleName);
    if (!scannerRole) {
      throw new NotFoundException(`Scanner role "${scannerRoleName}" not found`);
    }

    const scanConfig = scannerRole.metadataScanned[this.SCAN_CONFIG_KEY];
    if (!scanConfig?.scan || !scanConfig.scope) {
      // If no scope restrictions, allow scanning
      return true;
    }

    const { type, values = [] } = scanConfig.scope;

    if (type === 'major' && values.length > 0) {
      return userMajorId ? values.includes(userMajorId) : false;
    }

    if (type === 'school' && values.length > 0) {
      return userSchoolId ? values.includes(userSchoolId) : false;
    }

    // If no specific scope type or values are set, allow scanning
    return true;
  }

  /**
   * Gets the scanning scope configuration for a role
   * @param roleName - Name of the role
   * @returns The scope configuration or null if not found
   */
  async getScanScope(roleName: string): Promise<{
    type?: 'major' | 'school';
    values?: string[];
  } | null> {
    const role = await this.findByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }

    const scanConfig = role.metadataScanned[this.SCAN_CONFIG_KEY];
    if (!scanConfig?.scan || !scanConfig.scope) {
      return null;
    }

    return {
      type: scanConfig.scope.type,
      values: scanConfig.scope.values || [],
    };
  }

  async getCanScanRoles(roleName: string): Promise<string[]> {
    const role = await this.findByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }

    const scanConfig = role.metadataScanned[this.SCAN_CONFIG_KEY];
    if (!scanConfig?.scan) {
      console.log('SCAN CONFIG NOT FOUND');
      return [];
    }

    console.log('SCAN CONFIG FOUND');
    console.log('CAN SCAN ROLES:', scanConfig.canScan);
    console.log('TARGET ROLE:', roleName);
    console.log('CAN SCAN ROLES INCLUDES TARGET ROLE:', scanConfig.canScan?.includes(roleName));
    return scanConfig.canScan || [];
  }
}
