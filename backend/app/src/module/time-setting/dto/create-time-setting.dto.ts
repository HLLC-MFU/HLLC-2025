import { Type } from "class-transformer";
import { IsISO8601, IsNotEmpty } from "class-validator";

export class CreateTimeSettingDto {
    @IsNotEmpty()
    @IsISO8601()
    @Type(() => Date)
    date: Date
}
