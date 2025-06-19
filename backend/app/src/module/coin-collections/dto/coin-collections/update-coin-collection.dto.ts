import { PartialType } from '@nestjs/swagger';
import { CreateCoinCollectionDto } from './create-coin-collection.dto';

export class UpdateCoinCollectionDto extends PartialType(CreateCoinCollectionDto) {}
