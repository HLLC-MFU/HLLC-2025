import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School, SchoolDocument } from './schemas/school.schema';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { SharedMetadataService } from 'src/pkg/shared/metadata/metadata.service';
import { MetadataEnrichmentService } from 'src/pkg/shared/enrichment/metadata-enrichment.service';
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(
    @InjectModel(School.name) private readonly schoolModel: Model<SchoolDocument>,
    private readonly metadataService: SharedMetadataService,
    private readonly enrichmentService: MetadataEnrichmentService,
  ) {}

  async create(createSchoolDto: CreateSchoolDto): Promise<School> {
    await throwIfExists(this.schoolModel, { name: createSchoolDto.name }, 'School name already exists');
    const school = await this.schoolModel.create(createSchoolDto);
    await this.metadataService.invalidate(['schools']);
    return school;
  }

  async findAll(page = 1, limit?: number) {
    const query = this.schoolModel.find();

    if (limit !== undefined && limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }

    const [data, total, latest] = await Promise.all([
      query.lean(),
      this.schoolModel.countDocuments(),
      this.schoolModel.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
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

  async findOne(id: string): Promise<School> {
    return findOrThrow(this.schoolModel, id, 'School');
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<School> {
    const school = await findOrThrow(this.schoolModel, id, 'School');
    Object.assign(school, updateSchoolDto);
    await school.save();
    await this.metadataService.invalidate(['schools']);
    return school;
  }

  async remove(id: string): Promise<void> {
    await findOrThrow(this.schoolModel, id, 'School');
    await this.schoolModel.findByIdAndDelete(id);
    await this.metadataService.invalidate(['schools']);
  }
}
