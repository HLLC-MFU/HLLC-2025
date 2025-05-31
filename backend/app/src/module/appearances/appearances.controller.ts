import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppearancesService } from './appearances.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import {
  generateFilename,
  saveFileToUploadDir,
} from 'src/pkg/config/storage.config';
import { parseNestedField } from 'src/pkg/helper/request.util';

@Controller('appearances')
export class AppearancesController {
  constructor(private readonly appearancesService: AppearancesService) { }

  @Post()
  @Permissions('appearance:create')
  async create(@Req() req: FastifyRequest) {
    const parts = (req as any).parts?.();
    if (!parts) {
      throw new HttpException('Multipart/form-data required', HttpStatus.BAD_REQUEST);
    }

    const createAppearanceDto: any = {};
    const assets: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        if (buffer.length > 1024 * 500) {
          throw new HttpException('File too large (max 500KB)', HttpStatus.UNPROCESSABLE_ENTITY);
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);

        const match = part.fieldname.match(/^assets\[(.+)\]$/);
        if (match) {
          assets[match[1]] = filename;
        } else if (part.fieldname === 'appearance') {
          assets.appearance = filename;
        } else {
          throw new HttpException('Invalid file field. Expected assets[...] or appearance', HttpStatus.BAD_REQUEST);
        }
      } else if (part.type === 'field') {
        parseNestedField(createAppearanceDto, part.fieldname, part.value);
      }
    }

    if (createAppearanceDto.school) {
      try {
        createAppearanceDto.school = new mongoose.Types.ObjectId(createAppearanceDto.school);
      } catch {
        throw new HttpException('Invalid school ObjectId', HttpStatus.BAD_REQUEST);
      }
    }

    createAppearanceDto.assets = assets;
    return this.appearancesService.create(createAppearanceDto);
  }

  @Public()
  @Get()
  findAll(query: Record<string, string>) {
    return this.appearancesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('findOne', id);
    return this.appearancesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('appearance:update')
  async update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const parts = (req as any).parts?.();
    if (!parts) {
      throw new HttpException('Multipart/form-data required', HttpStatus.BAD_REQUEST);
    }

    const updateAppearanceDto: any = { updatedAt: new Date() };
    const assets: Record<string, string> = {};

    const existingAppearance = await this.appearancesService.findOne(id);
    if (!existingAppearance) {
      throw new HttpException('Appearance not found', HttpStatus.NOT_FOUND);
    }

    const existingAssets = existingAppearance.data?.[0]?.assets || {};
    Object.assign(assets, existingAssets);

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        if (buffer.length > 1024 * 500) {
          throw new HttpException('File too large (max 500KB)', HttpStatus.UNPROCESSABLE_ENTITY);
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);

        const match = part.fieldname.match(/^assets\[(.+)\]$/);
        if (match) {
          assets[match[1]] = filename;
        } else if (part.fieldname === 'appearance') {
          assets.appearance = filename;
        } else {
          throw new HttpException('Invalid file field. Expected assets[...] or appearance', HttpStatus.BAD_REQUEST);
        }
      } else if (part.type === 'field') {
        parseNestedField(updateAppearanceDto, part.fieldname, part.value);
      }
    }

    updateAppearanceDto.assets = assets;
    const updated = await this.appearancesService.update(id, updateAppearanceDto);
    return { data: updated };
  }

  @Delete(':id')
  @Permissions('appearance:delete')
  remove(@Param('id') id: string) {
    return this.appearancesService.remove(id);
  }
}
