import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { PrepostQuestionService } from './prepost-question.service';
import { CreatePrepostQuestiontDto } from './dto/create-prepost-question.dto';
import { UpdatePrepostQuestiontDto } from './dto/update-prepost-qustion.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('prepost-question')
@Controller('prepost-question')
export class PrepostQuestionController {
  constructor(private readonly PrepostService: PrepostQuestionService) {}

  @Post()
  @Permissions('prepost-question:create')
  create(@Body() createPosttestDto: CreatePrepostQuestiontDto) {
    return this.PrepostService.create(createPosttestDto);
  }

  @Get()
  @Permissions('prepost-question:read')
  findAll(@Query() query: Record<string, string>) {
    return this.PrepostService.findAll(query);
  }

  @Get(':id')
  @Permissions('prepost-question:read')
  findOne(@Param('id') id: string) {
    return this.PrepostService.findOne(id);
  }

  @Patch(':id')
  @Permissions('prepost-question:update')
  update(@Param('id') id: string, @Body() updatePosttestDto: UpdatePrepostQuestiontDto) {
    return this.PrepostService.update(id, updatePosttestDto);
  }

  @Delete(':id')
  @Permissions('prepost-question:delete')
  remove(@Param('id') id: string) {
    return this.PrepostService.remove(id);
  }
}
