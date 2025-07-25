import { IsString } from 'class-validator';

export class SetPasswordSmoDto {
    @IsString()
    password: string;
}
