import { BadRequestException } from '@nestjs/common';

type MetadataFieldSchema = {
  type: 'string' | 'number' | 'boolean' | 'date';
  label?: string;
  required?: boolean;
};

export function validateMetadataSchema<TMetadata extends Record<string, unknown> | undefined>(
  metadata: TMetadata,
  metadataSchema: Record<string, MetadataFieldSchema>,
): void {
  // 🔥 ถ้า schema ว่าง → ไม่ต้อง validate
  if (Object.keys(metadataSchema || {}).length === 0) return;

  // 🔥 ถ้ามี required field แต่ metadata เป็น undefined → โยน error
  const hasRequired = Object.values(metadataSchema).some((f) => f.required);
  if (hasRequired && !metadata) {
    throw new BadRequestException('Metadata is required for this role');
  }

  // 🔥 ถ้าไม่มี metadata → จบ
  if (!metadata) return;

  const missingFields: string[] = [];
  const typeMismatches: string[] = [];

  for (const field in metadataSchema) {
    const schemaField = metadataSchema[field];
    const value = metadata[field];

    if (schemaField.required && (value === undefined || value === null)) {
      missingFields.push(field);
      continue;
    }

    if (value !== undefined && value !== null) {
      switch (schemaField.type) {
        case 'string':
          if (typeof value !== 'string') {
            typeMismatches.push(`${field} should be string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            typeMismatches.push(`${field} should be number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            typeMismatches.push(`${field} should be boolean`);
          }
          break;
        case 'date':
          const date = new Date(value as string | number | Date);
          if (isNaN(date.getTime())) {
            typeMismatches.push(`${field} should be a valid date`);
          }
          break;
      }
    }
  }

  if (missingFields.length > 0) {
    throw new BadRequestException(
      `Missing required metadata fields: ${missingFields.join(', ')}`,
    );
  }

  if (typeMismatches.length > 0) {
    throw new BadRequestException(
      `Metadata fields type mismatch: ${typeMismatches.join(', ')}`,
    );
  }

  // ลบ field ที่ไม่อยู่ใน schema
  Object.keys(metadata).forEach((key) => {
    if (!metadataSchema[key]) {
      delete metadata[key];
    }
  });
}
