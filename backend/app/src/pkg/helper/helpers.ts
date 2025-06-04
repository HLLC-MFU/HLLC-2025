import { BadRequestException } from '@nestjs/common';

interface MongoError extends Error {
  code: number;
  message: string;
}

export function handleMongoDuplicateError(err: Error, field: string): never {
  if (
    err &&
    'code' in err &&
    'message' in err &&
    (err as MongoError).code === 11000 &&
    err.message.includes(field)
  ) {
    throw new BadRequestException(`${field} already exists`);
  }
  throw err;
}
