import { BadRequestException } from "@nestjs/common";

export function handleMongoDuplicateError(err: unknown, field: string): never {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      'message' in err &&
      (err as any).code === 11000 &&
      (err as any).message.includes(field)
    ) {
      throw new BadRequestException(`${field} already exists`);
    }
    throw err;
}