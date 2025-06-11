import { PartialType } from '@nestjs/mapped-types';
import { CreatePosttestDto } from './create-post-test.dto';

export class UpdatePosttestDto extends PartialType(CreatePosttestDto) {
    updatedAt: Date;
}
