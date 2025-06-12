import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { CreatePrepostQuestiontDto } from '../dto/prepost-question/create-prepost-question.dto';
import { UpdatePrepostQuestiontDto } from '../dto/prepost-question/update-prepost-qustion.dto';
import { PrepostQuestionsService } from '../service/prepost-questions.service';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('prepost-questions')
@Controller('prepost-questions')
export class PrepostQuestionsController {
  constructor(private readonly PrepostQuestionsService: PrepostQuestionsService) { }

  @Post()
  @Permissions('prepost-questions:create')
  create(@Body() createPrepostQuestionDto: CreatePrepostQuestiontDto) {
    return this.PrepostQuestionsService.create(createPrepostQuestionDto);
  }

  @Get()
  @Permissions('prepost-questions:read')
  findAll(@Query() query: Record<string, string>) {
    return this.PrepostQuestionsService.findAll(query);
  }

  @Get(':id')
  @Permissions('prepost-questions:read')
  findOne(@Param('id') id: string) {
    return this.PrepostQuestionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('prepost-questions:update')
  update(@Param('id') id: string, @Body() updatePrepostDto: UpdatePrepostQuestiontDto) {
    return this.PrepostQuestionsService.update(id, updatePrepostDto);
  }

  @Delete(':id')
  @Permissions('prepost-questions:delete')
  remove(@Param('id') id: string) {
    return this.PrepostQuestionsService.remove(id);
  }
}
