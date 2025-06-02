import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpException, HttpStatus, Req, UseInterceptors, } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { FastifyRequest } from 'fastify';
import { generateFilename, saveFileToUploadDir } from 'src/pkg/config/storage.config';
import path from 'path';
import * as fs from 'fs';
import { ParseMultipartFormInterceptor } from '../../pkg/interceptors/parse-multipart.interceptor';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';


// @UseGuards(PermissionsGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Post()
  @Permissions('campaign:create')
  @UseInterceptors(ParseMultipartFormInterceptor)
  async create(@Req() req: FastifyRequest) {
    const body = (req as any).parsedBody;
    const files = (req as any).parsedFiles as any[];

    const dto: any = {
      name: body.name,
      detail: body.detail,
      budget: parseFloat(body.budget),
      startAt: body.startAt,
      endAt: body.endAt,
    };

    const imageFile = files.find(f => f.fieldname === 'image');
    if (imageFile) {
      const filename = `${Date.now()}-${imageFile.filename}`;
      const uploadPath = path.resolve('uploads');
      if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
      fs.writeFileSync(path.join(uploadPath, filename), imageFile.buffer);
      dto.image = filename;
    }

    // ✅ validate DTO
    const instance = plainToInstance(CreateCampaignDto, dto);
    const errors = await validate(instance);
    if (errors.length > 0) {
      throw new HttpException({ message: 'Validation Error', errors }, HttpStatus.BAD_REQUEST);
    }

    return this.campaignsService.create(dto);
  }


  @Get()
  findAll(query: Record<string, string>) {
    return this.campaignsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('findOne', id);
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('campaign:update')
  @UseInterceptors(ParseMultipartFormInterceptor)
  async update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const body = (req as any).parsedBody;
    const files = (req as any).parsedFiles as any[];

    const dto: any = {
      updatedAt: new Date(),
    };

    if (body.name) dto.name = body.name;
    if (body.detail) dto.detail = body.detail;
    if (body.budget) dto.budget = parseFloat(body.budget);
    if (body.startAt) dto.startAt = body.startAt;
    if (body.endAt) dto.endAt = body.endAt;

    const imageFile = files.find(f => f.fieldname === 'image');
    if (imageFile) {
      const buffer = imageFile.buffer;
      const filename = generateFilename(imageFile.filename);
      saveFileToUploadDir(filename, buffer);
      dto.image = filename;
    }

    // ✅ validate DTO
    const instance = plainToInstance(UpdateCampaignDto, dto);
    const errors = await validate(instance);
    if (errors.length > 0) {
      throw new HttpException({ message: 'Validation Error', errors }, HttpStatus.BAD_REQUEST);
    }

    return this.campaignsService.update(id, dto);
  }
  


  @Delete(':id')
  @Permissions('campaign:delete')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
