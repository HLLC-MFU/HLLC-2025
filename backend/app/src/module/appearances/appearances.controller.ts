import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, HttpException, HttpStatus, Req } from '@nestjs/common';
import { AppearancesService } from './appearances.service';
import { CreateAppearanceDto } from './dto/create-appearance.dto';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { FastifyRequest } from 'fastify';
import mongoose, { Types } from 'mongoose';
import { generateFilename, saveFileToUploadDir } from 'src/pkg/config/storage.config';

// @UseGuards(PermissionsGuard)
@Controller('appearances')
export class AppearancesController {
  constructor(private readonly appearancesService: AppearancesService,) { }

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
        const isAsset = part.fieldname.startsWith('assets[');
        const isAppearance = part.fieldname === 'appearance';

        if (!isAsset && !isAppearance) {
          throw new HttpException('Invalid file field. Expected assets[...] or appearance', HttpStatus.BAD_REQUEST);
        }

        const buffer = await part.toBuffer();
        if (buffer.length > 1024 * 500) {
          throw new HttpException('File too large (max 500KB)', HttpStatus.UNPROCESSABLE_ENTITY);
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);

        if (isAppearance) {
          assets.appearance = filename;
        } else {
          const key = part.fieldname.match(/assets\[(.+)\]/)?.[1];
          if (key) assets[key] = filename;
        }

      } else if (part.type === 'field') {
        const keys = part.fieldname.match(/[^[\]]+/g);
        if (keys?.length === 2) {
          createAppearanceDto[keys[0]] ??= {};
          createAppearanceDto[keys[0]][keys[1]] = part.value;
        } else {
          createAppearanceDto[part.fieldname] = part.value;
        }
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

    // Get existing appearance first
    const existingAppearance = await this.appearancesService.findOne(id);
    if (!existingAppearance) {
      throw new HttpException('Appearance not found', HttpStatus.NOT_FOUND);
    }

    // Initialize assets with existing values
    const existingAssets = existingAppearance.data[0].assets as Record<string, string>;
    assets.background = existingAssets.background || "";
    assets.backpack = existingAssets.backpack || "";
    assets.appearance = existingAssets.appearance || "";

    for await (const part of parts) {
      if (part.type === 'file') {
        const isAsset = part.fieldname.startsWith('assets[');
        const isAppearance = part.fieldname === 'appearance';

        if (!isAsset && !isAppearance) {
          throw new HttpException('Invalid file field. Expected assets[...] or appearance', HttpStatus.BAD_REQUEST);
        }

        const buffer = await part.toBuffer();
        if (buffer.length > 1024 * 500) {
          throw new HttpException('File too large (max 500KB)', HttpStatus.UNPROCESSABLE_ENTITY);
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);

        if (isAppearance) {
          assets.appearance = filename;
        } else {
          const key = part.fieldname.match(/assets\[(.+)\]/)?.[1];
          if (key) assets[key] = filename;
        }

      } else if (part.type === 'field') {
        const keys = part.fieldname.match(/[^[\]]+/g);
        if (keys?.length === 2) {
          updateAppearanceDto[keys[0]] ??= {};
          updateAppearanceDto[keys[0]][keys[1]] = part.value;
        } else {
          updateAppearanceDto[part.fieldname] = part.value;
        }
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
