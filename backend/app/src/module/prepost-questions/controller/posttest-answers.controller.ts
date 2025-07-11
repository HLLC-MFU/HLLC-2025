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
import { CreatePosttestAnswerDto } from '../dto/posttest-answer/create-posttest-answer.dto';
import { PosttestAnswersService } from '../service/posttest-answers.service';

@UseGuards(PermissionsGuard)
@Controller('posttest-answers')
export class PosttestAnswersController {
  constructor(
    private readonly posttestAnswersService: PosttestAnswersService,
  ) {}

  @Post()
  create(@Body() createPosttestAnswerDto: CreatePosttestAnswerDto) {
    return this.posttestAnswersService.create(createPosttestAnswerDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.posttestAnswersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.posttestAnswersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.posttestAnswersService.remove(id);
  }

  @Get('/all/average')
  getAverageAll() {
    return this.posttestAnswersService.averageAllPosttests();
  }
}
