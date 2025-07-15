import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PermissionsGuard } from 'src/module/auth/guards/permissions.guard';
import { CreatePrepostQuestiontDto } from '../dto/prepost-question/create-prepost-question.dto';
import { UpdatePrepostQuestiontDto } from '../dto/prepost-question/update-prepost-qustion.dto';
import { PrepostQuestionsService } from '../service/prepost-questions.service';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('prepost-questions')
export class PrepostQuestionsController {
  constructor(
    private readonly prepostQuestionsService: PrepostQuestionsService,
  ) {}

  @Post()
  async create(@Body() body: CreatePrepostQuestiontDto | CreatePrepostQuestiontDto[]) {
    return this.prepostQuestionsService.create(body);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.prepostQuestionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prepostQuestionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePrepostDto: UpdatePrepostQuestiontDto,
  ) {
    return this.prepostQuestionsService.update(id, updatePrepostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prepostQuestionsService.remove(id);
  }
}
