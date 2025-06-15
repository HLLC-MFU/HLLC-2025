import { PartialType } from '@nestjs/swagger';
import { CreateSponsorsTypeDto } from './create-sponsors-type.dto';

export class UpdateSponsorsTypeDto extends PartialType(CreateSponsorsTypeDto) {}
