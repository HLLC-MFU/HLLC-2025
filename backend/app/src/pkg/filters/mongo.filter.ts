import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';
import { FastifyReply } from 'fastify';

@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {

    // ✅ เช็กว่า context เป็น HTTP
    if (host.getType() !== 'http') {
      this.logger.warn('Non-HTTP context detected, skipping custom error handling');
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    // ✅ ปล่อย Nest จัดการ error ปกติของ HTTP (เช่น NotFoundException)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        response.status(status).send(res);
        return;
      }

      response.status(status).send({
        statusCode: status,
        message: exception.message,
        error: 'Bad Request',
      });
      return;
    }

    // Duplicate Key Error (MongoError: code 11000)
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as { code: number }).code === 11000
    ) {
      const duplicatedField = Object.keys(
        (exception as { keyValue?: Record<string, string> }).keyValue || {},
      ).join(', ');

      response.status(HttpStatus.CONFLICT).send({
        statusCode: HttpStatus.CONFLICT,
        message: `Duplicate key error on field(s): ${duplicatedField}`,
        error: 'Conflict',
      });
      return;
    }

    // Validation Error (Mongoose)
    if (exception instanceof MongooseError.ValidationError) {
      const errors = Object.values(exception.errors).map(
        (err) => (err as { message: string }).message,
      );
      response.status(HttpStatus.BAD_REQUEST).send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation Error',
        errors,
      });
      return;
    }

    // 🟡 Log อื่นๆ
    this.logger.error('Unhandled exception:', exception);

    // default: Internal Server Error
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error:
        exception instanceof Error ? exception.message : 'Unknown error occurred',
    });
  }
}
