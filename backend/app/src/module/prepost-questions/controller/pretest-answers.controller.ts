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
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreatePretestAnswerDto } from '../dto/pretest-answer/create-pretest-answer.dto';
import { PretestAnswersService } from '../service/pretest-answers.service';

@UseGuards(PermissionsGuard)
@ApiTags('pretest-answers')
@Controller('pretest-answers')
export class PretestAnswersController {
  constructor(private readonly pretestAnswersService: PretestAnswersService) {}

  @Post()
  @Permissions('pretest-answers:create')
  create(@Body() createPreTestAnswerDto: CreatePretestAnswerDto) {
    return this.pretestAnswersService.create(createPreTestAnswerDto);
  }

  @Get()
  @Permissions('pretest-answers:read')
  findAll(@Query() query: Record<string, string>) {
    return this.pretestAnswersService.findAll(query);
  }

  @Get(':id')
  @Permissions('pretest-answers:read')
  findOne(@Param('id') id: string) {
    return this.pretestAnswersService.findOne(id);
  }

  @Delete(':id')
  @Permissions('pretest-answers:delete')
  remove(@Param('id') id: string) {
    return this.pretestAnswersService.remove(id);
  }

  @Get('/all/average')
  @Permissions('pretest-answers:read')
  getAverageAll() {
    return this.pretestAnswersService.averageAllPretests();
  }
}
