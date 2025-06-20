import { PartialType } from '@nestjs/mapped-types';
import { CreateInterfacesDto } from './create-interfaces.dto';

export class UpdateInterfacesDto extends PartialType(CreateInterfacesDto) {}
