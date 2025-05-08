import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Inject } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { MetadataCacheInterceptor } from '../../pkg/interceptors/metadata-cache.interceptor';
import { ModuleCacheInterceptor, CacheTTL, NoCache } from '../../pkg/interceptors/module-cache.interceptor';

@Controller('schools')
@UseInterceptors(MetadataCacheInterceptor)
export class SchoolsController {
  constructor(
    private readonly schoolsService: SchoolsService,
    private readonly metadataCacheInterceptor: MetadataCacheInterceptor,
  ) {}

  @Post()
  @NoCache()
  async create(@Body() createSchoolDto: CreateSchoolDto) {
    const result = await this.schoolsService.create(createSchoolDto);
    await this.metadataCacheInterceptor.invalidateCache('/api/schools');
    return result;
  }

  @Get()
  @CacheTTL(3600) // 1 hour
  findAll() {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  @UseInterceptors(ModuleCacheInterceptor)
  @CacheTTL(1800) // 30 minutes
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Patch(':id')
  @NoCache()
  async update(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    updateSchoolDto.updatedAt = new Date();
    const result = await this.schoolsService.update(id, updateSchoolDto);
    await this.metadataCacheInterceptor.invalidateCache('/api/schools');
    return result;
  }

  @Delete(':id')
  @NoCache()
  async remove(@Param('id') id: string) {
    const result = await this.schoolsService.remove(id);
    await this.metadataCacheInterceptor.invalidateCache('/api/schools');
    return result;
  }
}
