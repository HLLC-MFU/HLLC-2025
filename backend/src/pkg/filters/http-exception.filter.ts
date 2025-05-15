import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      
      // Get the response from the exception
      const exceptionResponse = exception.getResponse();
      
      // Extract message and details
      if (typeof exceptionResponse === 'object') {
        const exceptionObj = exceptionResponse as any;
        message = exceptionObj.message || exception.message;
        // Include any additional error details if available
        errorDetails = exceptionObj.error || exceptionObj;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = {
        name: exception.name,
        stack: process.env.NODE_ENV === 'production' ? undefined : exception.stack,
      };
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      errorDetails: process.env.NODE_ENV === 'production' ? undefined : errorDetails,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    this.logger.error('Exception occurred', {
      error: exception,
      ...errorResponse,
    });

    response.status(status).send(errorResponse);
  }
} 