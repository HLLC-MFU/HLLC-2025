import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { CreatePrepostQuestiontDto } from '../dto/prepost-question/create-prepost-question.dto';
import { UpdatePrepostQuestiontDto } from '../dto/prepost-question/update-prepost-qustion.dto';
import { PrepostQuestionService } from '../service/prepost-question.service';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('prepost-question')
@Controller('prepost-question')
export class PrepostQuestionController {
  constructor(private readonly PrepostQuestionService: PrepostQuestionService) {}

  @Post()
  @Permissions('prepost-question:create')
  create(@Body() createPrepostQuestionDto: CreatePrepostQuestiontDto) {
    return this.PrepostQuestionService.create(createPrepostQuestionDto);
  }

  @Get()
  @Permissions('prepost-question:read')
  findAll(@Query() query: Record<string, string>) {
    return this.PrepostQuestionService.findAll(query);
  }

  @Get(':id')
  @Permissions('prepost-question:read')
  findOne(@Param('id') id: string) {
    return this.PrepostQuestionService.findOne(id);
  }

  @Patch(':id')
  @Permissions('prepost-question:update')
  update(@Param('id') id: string, @Body() updatePrepostDto: UpdatePrepostQuestiontDto) {
    return this.PrepostQuestionService.update(id, updatePrepostDto);
  }

  @Delete(':id')
  @Permissions('prepost-question:delete')
  remove(@Param('id') id: string) {
    return this.PrepostQuestionService.remove(id);
  }
}
