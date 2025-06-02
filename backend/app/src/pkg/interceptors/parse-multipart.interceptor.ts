import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';
import { parseNestedField } from '../helper/request.util';

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
