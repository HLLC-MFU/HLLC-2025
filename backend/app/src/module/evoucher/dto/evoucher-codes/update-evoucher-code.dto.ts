import { PartialType } from '@nestjs/swagger';
import { CreateEvoucherCodeDto } from './create-evoucher-code.dto';

export class UpdateEvoucherCodeDto extends PartialType(CreateEvoucherCodeDto) {}
