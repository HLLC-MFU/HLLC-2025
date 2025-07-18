import { PartialType } from '@nestjs/swagger';
import { CreateTimeSettingDto } from './create-time-setting.dto';

export class UpdateTimeSettingDto extends PartialType(CreateTimeSettingDto) {}
