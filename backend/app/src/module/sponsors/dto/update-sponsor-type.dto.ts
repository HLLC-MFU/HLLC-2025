import { PartialType } from '@nestjs/swagger';
import { CreateSponsorTypeDto } from './create-sponsor-type.dto';

export class UpdateSponsorTypeDto extends PartialType(CreateSponsorTypeDto) {}
