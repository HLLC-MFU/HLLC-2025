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
import { generateFilename, saveFileToUploadDir } from '../config/storage.config';
import { parseNestedField } from '../helper/request.util';

@Injectable()
export class MultipartInterceptor implements NestInterceptor {
  constructor(private readonly maxSizeKbs = 256) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const parts = (req as any).parts?.();

    if (!parts) {
      throw new HttpException('multipart/form-data required', HttpStatus.BAD_REQUEST);
    }

    const dto: any = {};

    for await (const part of parts) {
      const keys = part.fieldname.match(/[^[\]]+/g);

      // Handle file upload
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        if (buffer.length > this.maxSizeKbs * 1024) {
          throw new HttpException(
            `File too large (max ${this.maxSizeKbs}KB)`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);

        if (!keys) {
          dto[part.fieldname] = filename;
          continue;
        }

        // Handle nested file fields
        let target = dto;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!target[key]) {
            target[key] = {};
          }
          target = target[key];
        }

        const lastKey = keys[keys.length - 1];
        target[lastKey] = filename;
        continue;
      }

      // Handle field parsing (supports nested)
      if (part.type === 'field') {
        if (!keys) {
          dto[part.fieldname] = part.value;
          continue;
        }

        let target = dto;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!target[key]) {
            target[key] = {};
          }
          target = target[key];
        }

        const lastKey = keys[keys.length - 1];
        target[lastKey] = part.value;
      }
    }

    req.body = dto;
    return next.handle();
  }
}

@Injectable()
export class ParseMultipartFormInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const parts = (request as any).parts?.();

        if (!parts) {
            throw new HttpException('Multipart/form-data required', HttpStatus.BAD_REQUEST);
        }

        const body: any = {};
        const files: Express.Multer.File[] = [];

        for await (const part of parts) {
            if (part.type === 'field') {
                parseNestedField(body, part.fieldname, part.value);
            } else if (part.type === 'file') {
                const buffer = await part.toBuffer();
                part.buffer = buffer;
                files.push(part);
            }
        }

        // Attach parsed body and files to request
        (request as any).parsedBody = body;
        (request as any).parsedFiles = files;

        return next.handle();
    }
}
