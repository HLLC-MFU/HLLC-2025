import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import {
  generateFilename,
  saveFileToUploadDir,
} from 'src/pkg/config/storage.config';
import { MultipartFile, MultipartValue } from '@fastify/multipart';

interface AppearanceDto {
  colors: Record<string, string>;
  assets: Record<string, string>;
  school: string;
}

interface MultipartRequest extends FastifyRequest {
  parts(): AsyncIterableIterator<MultipartFile | MultipartValue<string>>;
}

@Injectable()
export class AppearanceMultipartInterceptor
  implements NestInterceptor<MultipartRequest, AppearanceDto>
{
  constructor(private readonly maxSizeMbs = 5) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<AppearanceDto>> {
    const req = context.switchToHttp().getRequest<MultipartRequest>();
    const parts = req.parts?.();

    if (!parts) {
      throw new HttpException(
        'multipart/form-data required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dto: AppearanceDto = {
      colors: {},
      assets: {},
      school: '',
    };

    for await (const part of parts) {
      if (!this.isFile(part) && part.fieldname === 'school') {
        dto.school = part.value.replace(/^"|"$/g, '');
        continue;
      }

      const keys = part.fieldname.match(/[^[\]]+/g);
      if (!keys) continue;

      const [fieldName, subField] = keys;

      if (this.isFile(part) && fieldName === 'assets' && subField) {
        const buffer = await part.toBuffer();
        if (buffer.length > this.maxSizeMbs * 1024 * 1024) {
          throw new HttpException(
            `File too large (max ${this.maxSizeMbs}MB)`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);
        dto.assets[subField] = filename;
      } else if (!this.isFile(part) && fieldName === 'colors' && subField) {
        const colorValue = part.value
          .replace(/^"|"$/g, '')
          .replace(/\\#/g, '#');
        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue)) {
          throw new HttpException(
            `Invalid hex color format for ${subField}: ${colorValue}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        dto.colors[subField] = colorValue;
      }
    }

    if (!dto.school) {
      throw new HttpException('School ID is required', HttpStatus.BAD_REQUEST);
    }

    req.body = dto;
    return next.handle();
  }

  private isFile(
    part: MultipartFile | MultipartValue<string>,
  ): part is MultipartFile {
    return 'filename' in part;
  }

  private isField(
    part: MultipartFile | MultipartValue<string>,
  ): part is MultipartValue<string> {
    return 'value' in part;
  }
}
