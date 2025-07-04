import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { StepAchievementService } from '../service/step-achievement.service';
import { CreateStepAchievementDto } from '../dto/step-achievement/create-step-achievement.dto';
import { UpdateStepAchievementDto } from '../dto/step-achievement/update-step-achievement.dto';

@Controller('step-achievement')
export class StepAchievementController {
  constructor(
    private readonly stepAchievementService: StepAchievementService,
  ) {}

  @Post()
  create(@Body() createStepAchievementDto: CreateStepAchievementDto) {
    return this.stepAchievementService.create(createStepAchievementDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.stepAchievementService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stepAchievementService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStepAchievementDto: UpdateStepAchievementDto,
  ) {
    return this.stepAchievementService.update(id, updateStepAchievementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stepAchievementService.remove(id);
  }
}
