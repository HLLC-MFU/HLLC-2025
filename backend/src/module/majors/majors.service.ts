import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major, MajorDocument } from './schemas/major.schema';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { SharedMetadataService } from 'src/pkg/shared/metadata/metadata.service';
import { MetadataEnrichmentService } from 'src/pkg/shared/enrichment/metadata-enrichment.service';
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';

@Injectable()
export class MajorsService {
  private readonly logger = new Logger(MajorsService.name);

  constructor(
    @InjectModel(Major.name) private readonly majorModel: Model<MajorDocument>,
    private readonly metadataService: SharedMetadataService,
    private readonly enrichmentService: MetadataEnrichmentService,
  ) {}

  async create(createMajorDto: CreateMajorDto): Promise<Major> {
    await throwIfExists(this.majorModel, { name: createMajorDto.name }, 'Major name already exists');
    const major = await this.majorModel.create(createMajorDto);
    await this.metadataService.invalidate(['majors']);
    return major;
  }

  async findAll(page = 1, limit?: number) {
    const query = this.majorModel.find();

    if (limit !== undefined && limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }

    const [data, total, latest] = await Promise.all([
      query.lean(),
      this.majorModel.countDocuments(),
      this.majorModel.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
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

  async findOne(id: string): Promise<Major> {
    return findOrThrow(this.majorModel, id, 'Major');
  }

  async update(id: string, updateMajorDto: UpdateMajorDto): Promise<Major> {
    const major = await findOrThrow(this.majorModel, id, 'Major');
    Object.assign(major, updateMajorDto);
    await major.save();
    await this.metadataService.invalidate(['majors']);
    return major;
  }

  async remove(id: string): Promise<void> {
    await findOrThrow(this.majorModel, id, 'Major');
    await this.majorModel.findByIdAndDelete(id);
    await this.metadataService.invalidate(['majors']);
  }
}
