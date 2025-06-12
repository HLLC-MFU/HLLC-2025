import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PreTestAnswerService } from './pre-test-answer.service';
import { CreatePreTestAnswerDto } from './dto/create-pre-test-answer.dto';
import { UpdatePreTestAnswerDto } from './dto/update-pre-test-answer.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('pre-test-answers')
@Controller('pre-test-answers')
export class PreTestAnswerController {
  constructor(private readonly preTestAnswerService: PreTestAnswerService) {}

  @Post()
  @Permissions('pre-test-answers:create')
  create(@Body() createPreTestAnswerDto: CreatePreTestAnswerDto) {
    return this.preTestAnswerService.create(createPreTestAnswerDto);
  }

  @Get()
  @Permissions('pre-test-answers:read')
  findAll(@Query() query: Record<string,string>) {
    return this.preTestAnswerService.findAll(query);
  }

  @Get(':id')
  @Permissions('pre-test-answers:read')
  findOne(@Param('id') id: string) {
    return this.preTestAnswerService.findOne(id);
  }

  @Patch(':id')
  @Permissions('pre-test-answers:update')
  update(@Param('id') id: string, @Body() updatePreTestAnswerDto: UpdatePreTestAnswerDto) {
    return this.preTestAnswerService.update(id, updatePreTestAnswerDto);
  }

  @Delete(':id')
  @Permissions('pre-test-answers:delete')
  remove(@Param('id') id: string) {
    return this.preTestAnswerService.remove(id);
  }
}
