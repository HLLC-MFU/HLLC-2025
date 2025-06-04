import { PartialType } from '@nestjs/swagger';
import { CreateEvoucherTypeDto } from './create-evoucher-type.dto';

export class UpdateEvoucherTypeDto extends PartialType(CreateEvoucherTypeDto) {}
