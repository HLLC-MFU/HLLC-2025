import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { SharedMetadataService } from 'src/pkg/shared/metadata/metadata.service';
import { MetadataEnrichmentService } from 'src/pkg/shared/enrichment/metadata-enrichment.service';
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    private readonly metadataService: SharedMetadataService,
    private readonly enrichmentService: MetadataEnrichmentService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    await throwIfExists(this.roleModel, { name: createRoleDto.name }, 'Role name already exists');
    const role = await this.roleModel.create(createRoleDto);
    await this.metadataService.invalidate(['roles']);
    return role;
  }

  async findAll(page = 1, limit?: number) {
    const query = this.roleModel.find();

    if (limit !== undefined && limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }

    const [data, total, latest] = await Promise.all([
      query.lean(),
      this.roleModel.countDocuments(),
      this.roleModel.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
    ]);

    const lastUpdatedAt = latest && 'updatedAt' in latest && latest.updatedAt instanceof Date
      ? latest.updatedAt.toISOString()
      : new Date().toISOString();

    return buildPaginatedResponse(data, {
      total,
      page,
      limit: limit ?? total,
      lastUpdatedAt,
    });
  }

  async findOne(id: string): Promise<Role> {
    return findOrThrow(this.roleModel, id, 'Role');
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');
    Object.assign(role, updateRoleDto);
    await role.save();
    await this.metadataService.invalidate(['roles']);
    return role;
  }

  async remove(id: string): Promise<void> {
    await findOrThrow(this.roleModel, id, 'Role');
    await this.roleModel.findByIdAndDelete(id);
    await this.metadataService.invalidate(['roles']);
  }

  async updateMetadataSchema(id: string, dto: UpdateMetadataSchemaDto): Promise<Role> {
    const role = await findOrThrow(this.roleModel, id, 'Role');
    role.metadataSchema = dto.metadataSchema;
    await role.save();
    await this.metadataService.invalidate(['roles']);
    return role;
  }
}
