import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

/**
 * DTO for batch removing multiple users
 */
export class RemoveMultipleDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  ids: string[];
} 