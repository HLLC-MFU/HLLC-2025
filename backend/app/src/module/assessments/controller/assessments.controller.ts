import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { CreateAssessmentDto } from '../dto/assessments/create-assessment.dto';
import { UpdateAssessmentDto } from '../dto/assessments/update-assessment.dto';
import { AssessmentsService } from '../service/assessments.service';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';


@UseGuards(PermissionsGuard)
@ApiTags('assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) { }

  @Post()
  @Permissions('assessments:create')
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentsService.create(createAssessmentDto);
  }

  @Get()
  @Permissions('assessments:read')
  findAll(@Query() query: Record<string, string>) {
    return this.assessmentsService.findAll(query);
  }

  @Get(':id')
  @Permissions('assessments:read')
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('assessments:update')
  update(@Param('id') id: string, @Body() updateAssessmentDto: UpdateAssessmentDto) {
    return this.assessmentsService.update(id, updateAssessmentDto);
  }

  @Delete(':id')
  @Permissions('assessments:delete')
  remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }

  @Get(':activityId/activity')
  @Permissions('assessments:read')
  listByActivity(@Param('activityId') activityId: string) {
    return this.assessmentsService.findAllByActivity(activityId);
  }
}
