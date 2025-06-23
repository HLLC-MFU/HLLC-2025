import { PartialType } from '@nestjs/swagger';
import { CreateLamduanFlowerDto } from './create-lamduan-flower.dto';

export class UpdateLamduanFlowerDto extends PartialType(
  CreateLamduanFlowerDto,
) {}
