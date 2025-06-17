import { PartialType } from '@nestjs/mapped-types';
import { CreateCmsDto } from './create-cms.dto';

export class UpdateCmsDto extends PartialType(CreateCmsDto) {}
