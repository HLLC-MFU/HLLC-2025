import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StepCountersService } from './step-counters.service';
import { CreateStepCounterDto } from './dto/create-step-counter.dto';
import { UpdateStepCounterDto } from './dto/update-step-counter.dto';

@Controller('step-counters')
export class StepCountersController {
  constructor(private readonly stepCountersService: StepCountersService) { }

  @Post()
  create(@Body() createStepCounterDto: CreateStepCounterDto) {
    return this.stepCountersService.create(createStepCounterDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.stepCountersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stepCountersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStepCounterDto: UpdateStepCounterDto) {
    return this.stepCountersService.update(id, updateStepCounterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stepCountersService.remove(id);
  }

  @Get(':schoolId/schools')
  findBySchool(@Param('schoolId') schoolId: string) {
    return this.stepCountersService.findAllBySchoolId(schoolId);
  }
}
