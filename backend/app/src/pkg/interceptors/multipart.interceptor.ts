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
import { MultipartFile } from '@fastify/multipart';

// Omit type from MultipartFile since we're redefining it
type MultipartPart = Omit<MultipartFile, 'type'> & {
  type: 'file' | 'field';
  value: string;
  fieldname: string;
  filename: string;
  toBuffer(): Promise<Buffer>;
};

type NestedValue = string | boolean | NestedObject | Array<string | NestedObject>;

interface NestedObject {
  [key: string]: NestedValue;
}

type ResponseData = Record<string, NestedValue>;

type RequestData = {
  body: NestedObject;
  parts: () => AsyncIterableIterator<MultipartPart>;
} & FastifyRequest;

@Injectable()
export class MultipartInterceptor implements NestInterceptor<RequestData, ResponseData> {
  constructor(private readonly maxSizeKbs = 256) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<ResponseData>> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const parts = req.parts?.();

    if (!parts) {
      throw new HttpException('multipart/form-data required', HttpStatus.BAD_REQUEST);
    }

    const dto: NestedObject = {};

    for await (const part of parts as AsyncIterableIterator<MultipartPart>) {
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
        let target: NestedObject | Array<string | NestedObject> = dto;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (key === '') {
            // Handle array notation []
            if (!Array.isArray(target)) {
              target = [];
            }
            target.push({});
            target = target[target.length - 1] as NestedObject;
          } else {
            if (!target || Array.isArray(target)) {
              target = {};
            }
            if (!(key in target)) {
              target[key] = {};
            }
            target = target[key] as NestedObject;
          }
        }

        const lastKey = keys[keys.length - 1];
        if (lastKey === '') {
          if (!Array.isArray(target)) {
            target = [];
          }
          target.push(filename);
        } else {
          if (!target || Array.isArray(target)) {
            target = {};
          }
          target[lastKey] = filename;
        }
        continue;
      }

      // Handle field parsing (supports nested)
      if (part.type === 'field') {
        if (!keys) {
          dto[part.fieldname] = part.value;
          continue;
        }

        let target: NestedObject | Array<string | NestedObject> = dto;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (key === '') {
            // Handle array notation []
            if (!Array.isArray(target)) {
              target = [];
            }
            target.push({});
            target = target[target.length - 1] as NestedObject;
          } else {
            if (!target || Array.isArray(target)) {
              target = {};
            }
            if (!(key in target)) {
              target[key] = {};
            }
            target = target[key] as NestedObject;
          }
        }

        const lastKey = keys[keys.length - 1];
        if (lastKey === '') {
          if (!Array.isArray(target)) {
            target = [];
          }
          target.push(part.value);
        } else {
          if (!target || Array.isArray(target)) {
            target = {};
          }
          target[lastKey] = part.value;
        }
      }
    }

    // Convert string "true"/"false" to boolean for metadata fields
    const metadata = dto.metadata as NestedObject;
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      if ('isOpen' in metadata && typeof metadata.isOpen === 'string') {
        metadata.isOpen = metadata.isOpen === 'true';
      }
      if ('isProgressCount' in metadata && typeof metadata.isProgressCount === 'string') {
        metadata.isProgressCount = metadata.isProgressCount === 'true';
      }
      if ('isVisible' in metadata && typeof metadata.isVisible === 'string') {
        metadata.isVisible = metadata.isVisible === 'true';
      }
    }

    req.body = dto;
    return next.handle();
  }
}
