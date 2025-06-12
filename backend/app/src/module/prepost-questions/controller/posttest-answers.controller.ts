import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreatePosttestAnswerDto } from '../dto/posttest-answer/create-posttest-answer.dto';
import { PosttestAnswersService } from '../service/posttest-answers.service'

@UseGuards(PermissionsGuard)
@ApiTags('posttest-answers')
@Controller('posttest-answers')
export class PosttestAnswersController {
  constructor(private readonly posttestAnswersService: PosttestAnswersService) { }

  @Post()
  @Permissions('posttest-answers:create')
  create(@Body() createPosttestAnswerDto: CreatePosttestAnswerDto) {
    return this.posttestAnswersService.create(createPosttestAnswerDto);
  }

  @Get()
  @Permissions('posttest-answers:read')
  findAll(@Query() query: Record<string, string>) {
    return this.posttestAnswersService.findAll(query);
  }

  @Get(':id')
  @Permissions('posttest-answers:read')
  findOne(@Param('id') id: string) {
    return this.posttestAnswersService.findOne(id);
  }

  @Delete(':id')
  @Permissions('posttest-answers:dalete')
  remove(@Param('id') id: string) {
    return this.posttestAnswersService.remove(id);
  }
}
