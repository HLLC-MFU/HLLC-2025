import { PartialType } from '@nestjs/mapped-types';
import { CreateActiviteDto } from './create-activite.dto';

// Default update activite dto
export class UpdateActiviteDto extends PartialType(CreateActiviteDto) {
  // Id of activite
  id: string;
}
