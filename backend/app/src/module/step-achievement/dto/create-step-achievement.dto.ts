import { Type } from "class-transformer";
import { IsISO8601, IsNumber } from "class-validator";

export class CreateStepAchievementDto {
    @IsNumber()
    achievement: number

    @IsISO8601()
    @Type(() => Date)
    startAt: Date

    @IsISO8601()
    @Type(() => Date)
    endAt: Date
}
