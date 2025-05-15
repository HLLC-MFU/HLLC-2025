import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsDate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

/**
 * Update user data transfer object
 * Used when updating an existing user
 * 
 * Extends CreateUserDto as a partial type, making all fields optional
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsDate()
    updatedAt?: Date;
}
