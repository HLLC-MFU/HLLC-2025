import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AssessmentAnswersService } from './assessment-answers.service';
import { CreateAssessmentAnswerDto } from './dto/create-assessment-answer.dto';
import { UpdateAssessmentAnswerDto } from './dto/update-assessment-answer.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('assessment-answers')
@Controller('assessment-answers')
export class AssessmentAnswersController {
  constructor(private readonly assessmentAnswersService: AssessmentAnswersService) { }

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

  @Patch(':id')
  @Permissions('assessment-answers:update')
  update(@Param('id') id: string, @Body() updateAssessmentAnswerDto: UpdateAssessmentAnswerDto) {
    return this.assessmentAnswersService.update(id, updateAssessmentAnswerDto);
  }

  @Delete(':id')
  @Permissions('assessment-answers:delete')
  remove(@Param('id') id: string) {
    return this.assessmentAnswersService.remove(id);
  }
}
