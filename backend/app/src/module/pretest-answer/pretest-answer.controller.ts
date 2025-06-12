import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PretestAnswerService } from './pretest-answer.service';
import { CreatePretestAnswerDto } from './dto/create-pretest-answer.dto';
import { UpdatePretestAnswerDto } from './dto/update-pretest-answer.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('pre-test-answers')
@Controller('pre-test-answers')
export class PretestAnswerController {
  constructor(private readonly pretestAnswerService: PretestAnswerService) {}

  @Post()
  @Permissions('pre-test-answers:create')
  create(@Body() createPreTestAnswerDto: CreatePretestAnswerDto) {
    return this.pretestAnswerService.create(createPreTestAnswerDto);
  }

  @Get()
  @Permissions('pre-test-answers:read')
  findAll(@Query() query: Record<string,string>) {
    return this.pretestAnswerService.findAll(query);
  }

  @Get(':id')
  @Permissions('pre-test-answers:read')
  findOne(@Param('id') id: string) {
    return this.pretestAnswerService.findOne(id);
  }

  @Patch(':id')
  @Permissions('pre-test-answers:update')
  update(@Param('id') id: string, @Body() updatePretestAnswerDto: UpdatePretestAnswerDto) {
    return this.pretestAnswerService.update(id, updatePretestAnswerDto);
  }

  @Delete(':id')
  @Permissions('pre-test-answers:delete')
  remove(@Param('id') id: string) {
    return this.pretestAnswerService.remove(id);
  }
}
