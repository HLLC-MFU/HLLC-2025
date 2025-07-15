import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AssessmentAnswersService } from '../service/assessment-answers.service';
import { CreateAssessmentAnswerDto } from '../dto/assessment-answers/create-assessment-answer.dto';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { UserRequest } from 'src/pkg/types/users';

@UseGuards(PermissionsGuard)
@ApiTags('assessment-answers')
@Controller('assessment-answers')
export class AssessmentAnswersController {
  constructor(
    private readonly assessmentAnswersService: AssessmentAnswersService,
  ) { }

  @Post()
  create(@Req() req: UserRequest,) {
    const dto = req.body as CreateAssessmentAnswerDto;
    dto.user = req.user._id.toString();
    return this.assessmentAnswersService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.assessmentAnswersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentAnswersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentAnswersService.remove(id);
  }

  @Get('/all/average')
  getAverageAll() {
    return this.assessmentAnswersService.averageAllAssessments();
  }

  @Get('/:activityId/average')
  getAverageByActivity(@Param('activityId') activityId: string) {
    return this.assessmentAnswersService.averageAssessmentsByActivity(
      activityId,
    );
  }
}
