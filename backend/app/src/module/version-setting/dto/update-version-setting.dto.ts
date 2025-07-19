import { PartialType } from '@nestjs/mapped-types';
import { CreateVersionSettingDto } from './create-version-setting.dto';

export class UpdateVersionSettingDto extends PartialType(CreateVersionSettingDto) {}
