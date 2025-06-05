import { IsObject } from 'class-validator';

export class UpdateMetadataSchemaDto {
  @IsObject()
  metadataSchema: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'date';
      label?: string;
      required?: boolean;
    }
  >;
}
