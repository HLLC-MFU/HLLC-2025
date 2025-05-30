import { HttpStatus } from "@nestjs/common";
import { HttpException } from "@nestjs/common";
import { CallHandler } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { NestInterceptor } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { Observable } from "rxjs";
import { generateFilename, saveFileToUploadDir } from "../config/storage.config";

@Injectable()
export class MultipartInterceptor implements NestInterceptor {
  constructor(
    private readonly maxSizeKbs = 256,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const parts = (req as any).parts?.();

    if (!parts) {
      throw new HttpException('multipart/form-data required', HttpStatus.BAD_REQUEST);
    }

    const dto: any = {};
    const name: Record<string, string> = {};
    const detail: Record<string, string> = {};
    const photo: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        const keys = part.fieldname.match(/[^[\]]+/g); // e.g., photo[coverPhoto]
        if (!keys || keys.length !== 2 || keys[0] !== 'photo') {
          throw new HttpException(`Invalid file field "${part.fieldname}"`, HttpStatus.BAD_REQUEST);
        }

        const buffer = await part.toBuffer();
        if (buffer.length > this.maxSizeKbs * 1024) {
          throw new HttpException(`File too large (max ${this.maxSizeKbs}KB)`, HttpStatus.UNPROCESSABLE_ENTITY);
        }

        const filename = generateFilename(part.filename);
        saveFileToUploadDir(filename, buffer);
        photo[keys[1]] = filename;
      }

      if (part.type === 'field') {
        const keys = part.fieldname.match(/[^[\]]+/g);
        if (keys?.[0] === 'name') name[keys[1]] = part.value;
        else if (keys?.[0] === 'detail') detail[keys[1]] = part.value;
        else dto[part.fieldname] = part.value;
      }
    }

    if (Object.keys(name).length) dto.name = name;
    if (Object.keys(detail).length) dto.detail = detail;
    if (Object.keys(photo).length) dto.photo = photo;

    if (dto.budget) dto.budget = parseFloat(dto.budget);
    if (dto.startAt) dto.startAt = new Date(dto.startAt);
    if (dto.endAt) dto.endAt = new Date(dto.endAt);

    req.body = dto;
    return next.handle();
  }
}
