import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssessmentAnswersService } from '../service/assessment-answers.service';
import { CreateAssessmentAnswerDto } from '../dto/assessment-answers/create-assessment-answer.dto';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('assessment-answers')
@Controller('assessment-answers')
export class AssessmentAnswersController {
  constructor(
    private readonly assessmentAnswersService: AssessmentAnswersService,
  ) {}

  @Post()
  @Permissions('assessment-answers:create')
  create(@Body() createAssessmentAnswerDto: CreateAssessmentAnswerDto) {
    return this.assessmentAnswersService.create(createAssessmentAnswerDto);
  }

  @Get()
  @Permissions('assessment-answers:read')
  findAll(@Query() query: Record<string, string>) {
    return this.assessmentAnswersService.findAll(query);
  }

  @Get(':id')
  @Permissions('assessment-answers:read')
  findOne(@Param('id') id: string) {
    return this.assessmentAnswersService.findOne(id);
  }

  @Delete(':id')
  @Permissions('assessment-answers:delete')
  remove(@Param('id') id: string) {
    return this.assessmentAnswersService.remove(id);
  }

  @Get('/all/average')
  @Permissions('assessment-answers:read')
  getAverageAll() {
    return this.assessmentAnswersService.averageAllAssessments();
  }

  @Get('/:activityId/average')
  @Permissions('assessment-answers:read')
  getAverageByActivity(@Param('activityId') activityId: string) {
    return this.assessmentAnswersService.averageAssessmentsByActivity(
      activityId,
    );
  }
}
