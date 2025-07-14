import { HttpStatus } from '@nestjs/common';

export function apiResponse<T>(
  data: T,
  message?: string,
  statusCode: HttpStatus = HttpStatus.OK,
) {
  return {
    statusCode,
    message: message ?? HttpStatus[statusCode],
    data,
  };
}
