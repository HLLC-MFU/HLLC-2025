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
import { generateFilename, saveFileToUploadDir } from 'src/pkg/config/storage.config';

@Injectable()
export class AppearanceMultipartInterceptor implements NestInterceptor {
  constructor(private readonly maxSizeKbs = 500) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const parts = (req as any).parts?.();

    if (!parts) {
      throw new HttpException('multipart/form-data required', HttpStatus.BAD_REQUEST);
    }

    const dto: any = {
      colors: {},
      assets: {}
    };

    for await (const part of parts) {
      const keys = part.fieldname.match(/[^[\]]+/g);
      if (!keys) {
        dto[part.fieldname] = part.value;
        continue;
      }

      const [fieldName, subField] = keys;

      // Handle file uploads (only for assets)
      if (part.type === 'file') {
        if (fieldName !== 'assets') {
          throw new HttpException(
            `Files can only be uploaded to assets fields, got: ${fieldName}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        const buffer = await part.toBuffer();
        if (buffer.length > this.maxSizeKbs * 1024) {
          throw new HttpException(
            `File too large (max ${this.maxSizeKbs}KB)`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);

        if (subField) {
          dto.assets[subField] = filename;
        }
        continue;
      }

      // Handle color fields
      if (part.type === 'field') {
        if (fieldName === 'colors' && subField) {
          // Validate hex color format
          const colorValue = part.value;
          if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue)) {
            throw new HttpException(
              `Invalid hex color format for ${subField}: ${colorValue}`,
              HttpStatus.BAD_REQUEST,
            );
          }
          dto.colors[subField] = colorValue;
        } else {
          // Handle other fields (like school)
          dto[fieldName] = part.value;
        }
      }
    }

    req.body = dto;
    return next.handle();
  }
} 