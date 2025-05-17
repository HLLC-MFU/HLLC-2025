import { BadRequestException } from '@nestjs/common';

export function userMetadataValidator(
  metadata: Record<string, any>,
  metadataSchema: Record<string, { type: string; required?: boolean }>,
) {
  for (const key in metadataSchema) {
    const rule = metadataSchema[key];

    // เช็ก required field
    if (
      rule.required &&
      (metadata[key] === undefined || metadata[key] === null)
    ) {
      throw new BadRequestException(`Metadata field '${key}' is required`);
    }

    // เช็ก type (ถ้ามีค่า)
    if (metadata[key] !== undefined && metadata[key] !== null) {
      switch (rule.type) {
        case 'string':
          if (typeof metadata[key] !== 'string') {
            throw new BadRequestException(
              `Metadata field '${key}' must be a string`,
            );
          }
          break;
        case 'number':
          if (typeof metadata[key] !== 'number') {
            throw new BadRequestException(
              `Metadata field '${key}' must be a number`,
            );
          }
          break;
        case 'boolean':
          if (typeof metadata[key] !== 'boolean') {
            throw new BadRequestException(
              `Metadata field '${key}' must be a boolean`,
            );
          }
          break;
        case 'date':
          if (isNaN(Date.parse(metadata[key]))) {
            throw new BadRequestException(
              `Metadata field '${key}' must be a valid date`,
            );
          }
          break;
        default:
          break;
      }
    }
  }
}
