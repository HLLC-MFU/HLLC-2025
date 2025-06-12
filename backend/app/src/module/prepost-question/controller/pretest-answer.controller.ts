import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreatePretestAnswerDto } from '../dto/pretest-answer/create-pretest-answer.dto';
import { PretestAnswerService } from '../service/pretest-answer.service';

@UseGuards(PermissionsGuard)
@ApiTags('pretest-answers')
@Controller('pretest-answers')
export class PretestAnswerController {
  constructor(private readonly pretestAnswerService: PretestAnswerService) {}

  @Post()
  @Permissions('pretest-answers:create')
  create(@Body() createPreTestAnswerDto: CreatePretestAnswerDto) {
    return this.pretestAnswerService.create(createPreTestAnswerDto);
  }

  @Get()
  @Permissions('pretest-answers:read')
  findAll(@Query() query: Record<string,string>) {
    return this.pretestAnswerService.findAll(query);
  }

  @Get(':id')
  @Permissions('pretest-answers:read')
  findOne(@Param('id') id: string) {
    return this.pretestAnswerService.findOne(id);
  }

  @Delete(':id')
  @Permissions('pretest-answers:delete')
  remove(@Param('id') id: string) {
    return this.pretestAnswerService.remove(id);
  }
}
