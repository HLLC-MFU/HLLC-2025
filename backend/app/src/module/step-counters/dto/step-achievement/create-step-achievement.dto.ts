import { IsNumber } from "class-validator";

export class CreateStepAchievementDto {
    @IsNumber()
    achievement: number
}
