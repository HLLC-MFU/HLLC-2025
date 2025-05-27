import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

/**
 * Custom Validation Pipe
 * - Extends NestJS's ValidationPipe to provide custom error message formatting.
 * - Enables transformation and whitelisting.
 * - Uses a custom exception factory to return detailed error messages.
 */
export const CustomValidationPipe = new ValidationPipe({
	transform: true,
	whitelist: true,
	exceptionFactory: (errors: ValidationError[]) => {
		const messages = errors.map((err) => {
				const field = err.property;
				const constraints = Object.values(err.constraints || {}).join(', ');
				return `${field}: ${constraints}`;
		});
		
		const exception =new BadRequestException({
				statusCode: 400,
				error: 'Bad Request',
				message: messages,
		});
		
		return exception;
	},
});