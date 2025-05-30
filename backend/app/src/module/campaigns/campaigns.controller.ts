import { Controller, Get, Post, Patch, Param, Delete, UseGuards, Req, UseInterceptors, Query } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { FastifyRequest } from 'fastify';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@UseGuards(PermissionsGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Post()
  @Permissions('campaign:create')
  @UseInterceptors(new MultipartInterceptor(500))
  async create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateCampaignDto;
    return this.campaignsService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.campaignsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('campaign:update')
  @UseInterceptors(new MultipartInterceptor(500))
  async update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateCampaignDto;
    dto.updatedAt = new Date();
    return this.campaignsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('campaign:delete')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
} 