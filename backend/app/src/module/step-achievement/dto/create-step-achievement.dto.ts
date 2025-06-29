import { Type } from "class-transformer";
import { IsISO8601, IsNumber } from "class-validator";

export class CreateStepAchievementDto {
    @IsNumber()
    achievement: number
}
