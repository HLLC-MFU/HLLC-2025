import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreatePretestAnswerDto } from '../dto/pretest-answer/create-pretest-answer.dto';
import { PretestAnswersService } from '../service/pretest-answers.service';

@UseGuards(PermissionsGuard)
@Controller('pretest-answers')
export class PretestAnswersController {
  constructor(private readonly pretestAnswersService: PretestAnswersService) {}

  @Post()
  create(@Body() createPreTestAnswerDto: CreatePretestAnswerDto) {
    return this.pretestAnswersService.create(createPreTestAnswerDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.pretestAnswersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pretestAnswersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pretestAnswersService.remove(id);
  }

  @Get('/all/average')
  getAverageAll() {
    return this.pretestAnswersService.averageAllPretests();
  }
}
