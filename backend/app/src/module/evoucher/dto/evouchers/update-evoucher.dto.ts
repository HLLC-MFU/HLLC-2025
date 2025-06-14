import { PartialType } from '@nestjs/swagger';
import { CreateEvoucherDto } from './create-evoucher.dto';

export class UpdateEvoucherDto extends PartialType(CreateEvoucherDto) {}