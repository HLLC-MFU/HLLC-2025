import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreatePretestAnswerDto } from '../dto/pretest-answer/create-pretest-answer.dto';
import { PretestAnswersService } from '../service/pretest-answers.service';
import { UserRequest } from 'src/pkg/types/users';

@UseGuards(PermissionsGuard)
@Controller('pretest-answers')
export class PretestAnswersController {
  constructor(private readonly pretestAnswersService: PretestAnswersService) { }

  @Post()
  create(@Req() req: UserRequest) {
    const dto = req.body as CreatePretestAnswerDto
    dto.user = req.user._id.toString();
    return this.pretestAnswersService.create(dto);
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

  @Get('user')
  async findByUser(@Req() req: UserRequest) {
    const userId = req.user._id.toString();
    return this.pretestAnswersService.findByUserId(userId);
  }
}
