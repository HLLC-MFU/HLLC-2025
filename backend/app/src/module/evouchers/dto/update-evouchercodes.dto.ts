import { PartialType } from '@nestjs/mapped-types';
import { CreateEvoucherCodeDto } from './create-evouchercodes.dto';

export class UpdateEvoucherCodeDto extends PartialType(CreateEvoucherCodeDto) {}
