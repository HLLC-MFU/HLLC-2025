import { PartialType } from '@nestjs/swagger';
import { CreateSystemStatusDto } from './create-system-status.dto';

export class UpdateSystemStatusDto extends PartialType(CreateSystemStatusDto) {}
