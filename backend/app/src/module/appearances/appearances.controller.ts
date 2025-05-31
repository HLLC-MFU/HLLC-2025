import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Req,
  HttpException,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { AppearancesService } from './appearances.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { FastifyRequest } from 'fastify';
import {
  generateFilename,
  saveFileToUploadDir,
} from 'src/pkg/config/storage.config';
import { ParseMultipartFormInterceptor } from '../../pkg/interceptors/parse-multipart.interceptor';
import { plainToInstance } from 'class-transformer';
import { CreateAppearanceDto } from './dto/create-appearance.dto';
import { validate } from 'class-validator';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';

@Controller('appearances')
export class AppearancesController {
  constructor(private readonly appearancesService: AppearancesService) { }


  @UseInterceptors(ParseMultipartFormInterceptor)
  @Post()
  @Permissions('appearance:create')
  async create(@Req() req: FastifyRequest) {
    const rawDto = { ...(req as any).parsedBody };
    const files = (req as any).parsedFiles || [];

    const assets: Record<string, string> = {};

    for (const part of files) {
      if (part.buffer.length > 1024 * 500) {
        throw new HttpException('File too large (max 500KB)', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const filename = generateFilename(part.filename);
      saveFileToUploadDir(filename, part.buffer);

      const match = part.fieldname.match(/^assets\[(.+)\]$/);
      if (match) {
        assets[match[1]] = filename;
      } else if (part.fieldname === 'appearance') {
        assets.appearance = filename;
      } else {
        throw new HttpException('Invalid file field. Expected assets[...] or appearance', HttpStatus.BAD_REQUEST);
      }
    }

    rawDto.assets = assets;

    // Validate DTO
    const dto = plainToInstance(CreateAppearanceDto, rawDto);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new HttpException({ message: 'Validation failed', errors }, HttpStatus.BAD_REQUEST);
    }

    return this.appearancesService.create(dto);
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
  @UseInterceptors(ParseMultipartFormInterceptor)
  async update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const rawDto = { ...(req as any).parsedBody || {}, updatedAt: new Date() };
    const files = (req as any).parsedFiles || [];

    const existingAppearance = await this.appearancesService.findOne(id);
    if (!existingAppearance) {
      throw new HttpException('Appearance not found', HttpStatus.NOT_FOUND);
    }

    const assets: Record<string, string> = { ...(existingAppearance.data?.[0]?.assets || {}) };

    for (const part of files) {
      if (part.buffer.length > 1024 * 500) {
        throw new HttpException('File too large (max 500KB)', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const filename = generateFilename(part.filename);
      saveFileToUploadDir(filename, part.buffer);

      const match = part.fieldname.match(/^assets\[(.+)\]$/);
      if (match) {
        assets[match[1]] = filename;
      } else if (part.fieldname === 'appearance') {
        assets.appearance = filename;
      } else {
        throw new HttpException('Invalid file field. Expected assets[...] or appearance', HttpStatus.BAD_REQUEST);
      }
    }

    rawDto.assets = assets;
    // dto validate
    const dto = plainToInstance(UpdateAppearanceDto, rawDto);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new HttpException({ message: 'Validation failed', errors }, HttpStatus.BAD_REQUEST);
    }

    const updated = await this.appearancesService.update(id, dto);
    return { data: updated };
  }


  @Delete(':id')
  @Permissions('appearance:delete')
  remove(@Param('id') id: string) {
    return this.appearancesService.remove(id);
  }
}
