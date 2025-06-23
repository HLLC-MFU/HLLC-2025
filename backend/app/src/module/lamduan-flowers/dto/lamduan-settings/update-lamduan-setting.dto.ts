import { PartialType } from '@nestjs/swagger';
import { CreateLamduanSettingDto } from './create-lamduan-setting.dto';

export class UpdateLamduanSettingDto extends PartialType(
  CreateLamduanSettingDto,
) {}
