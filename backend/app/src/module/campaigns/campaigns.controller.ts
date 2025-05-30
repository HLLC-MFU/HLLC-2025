import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpException, HttpStatus, Req } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { FastifyRequest } from 'fastify';
import { generateFilename, saveFileToUploadDir } from 'src/pkg/config/storage.config';
import path from 'path';
import * as fs from 'fs';


@UseGuards(PermissionsGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Post()
  @Permissions('campaign:create')
  async create(@Req() req: FastifyRequest) {
    const parts = (req as any).parts?.();
    if (!parts) {
      throw new HttpException('Multipart/form-data required', HttpStatus.BAD_REQUEST);
    }

    const createCampaignDto: any = {};
    const name: Record<string, string> = {};
    const detail: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'image') {
        const buffer = await part.toBuffer();
        const filename = `${Date.now()}-${part.filename}`;
        const uploadPath = path.resolve('uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        fs.writeFileSync(path.join(uploadPath, filename), buffer);
        createCampaignDto.image = { filename };
      } else if (part.type === 'field') {
        const keys = part.fieldname.match(/[^[\]]+/g); // e.g. name[th]
        if (keys?.[0] === 'name') name[keys[1]] = part.value;
        else if (keys?.[0] === 'detail') detail[keys[1]] = part.value;
        else createCampaignDto[part.fieldname] = part.value;
      }
    }

    createCampaignDto.name = name;
    createCampaignDto.detail = detail;

    if (createCampaignDto.budget) {
      createCampaignDto.budget = parseFloat(createCampaignDto.budget);
    }

    if (createCampaignDto.startAt) {
      createCampaignDto.startAt = new Date(createCampaignDto.startAt);
    }

    if (createCampaignDto.endAt) {
      createCampaignDto.endAt = new Date(createCampaignDto.endAt);
    }

    return this.campaignsService.create(createCampaignDto);
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
  async update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const parts = (req as any).parts?.();
    if (!parts) {
      throw new HttpException('multipart/form-data required', HttpStatus.BAD_REQUEST);
    }

    const updateCampaignDto: any = {};
    const name: Record<string, string> = {};
    const detail: Record<string, string> = {};
    let uploadedImageFilename: string | null = null;

    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname !== 'image') {
          throw new HttpException('Invalid file field. Only "image" allowed.', HttpStatus.BAD_REQUEST);
        }

        const buffer = await part.toBuffer();
        if (buffer.length > 1024 * 1000) {
          throw new HttpException('File too large (max 1MB)', HttpStatus.UNPROCESSABLE_ENTITY);
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);
        uploadedImageFilename = filename;

      } else if (part.type === 'field') {
        const keys = part.fieldname.match(/[^[\]]+/g); // e.g. name[th]
        if (keys?.[0] === 'name') name[keys[1]] = part.value;
        else if (keys?.[0] === 'detail') detail[keys[1]] = part.value;
        else updateCampaignDto[part.fieldname] = part.value;
      }
    }

    if (Object.keys(name).length) updateCampaignDto.name = name;
    if (Object.keys(detail).length) updateCampaignDto.detail = detail;

    if (uploadedImageFilename) {
      updateCampaignDto.image = {
        url: uploadedImageFilename,
        alt: '',
      };
    }

    if (updateCampaignDto.budget) {
      updateCampaignDto.budget = parseFloat(updateCampaignDto.budget);
    }

    if (updateCampaignDto.startAt) {
      updateCampaignDto.startAt = new Date(updateCampaignDto.startAt);
    }

    if (updateCampaignDto.endAt) {
      updateCampaignDto.endAt = new Date(updateCampaignDto.endAt);
    }

    updateCampaignDto.updatedAt = new Date();

    return this.campaignsService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @Permissions('campaign:delete')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
