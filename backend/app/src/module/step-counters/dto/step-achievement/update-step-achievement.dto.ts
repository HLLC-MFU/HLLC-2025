import { PartialType } from '@nestjs/swagger';
import { CreateStepAchievementDto } from './create-step-achievement.dto';

export class UpdateStepAchievementDto extends PartialType(CreateStepAchievementDto) {}
