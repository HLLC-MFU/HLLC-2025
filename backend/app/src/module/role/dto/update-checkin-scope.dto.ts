// dto/update-checkin-scope.dto.ts
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCheckinScopeDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Type(() => String)
    major: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Type(() => String)
    school: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Type(() => String)
    user?: string[];
}
