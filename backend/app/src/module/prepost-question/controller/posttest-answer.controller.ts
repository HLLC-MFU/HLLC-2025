import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreatePosttestAnswerDto } from '../dto/posttest-answer/create-posttest-answer.dto';
import { PosttestAnswerService } from '../service/posttest-answer.service'

@UseGuards(PermissionsGuard)
@ApiTags('posttest-answers')
@Controller('posttest-answers')
export class PostTestAnswerController {
  constructor(private readonly PosttestAnswerService: PosttestAnswerService) {}

  @Post()
  @Permissions('posttest-answers:create')
  create(@Body() createPosttestAnswerDto: CreatePosttestAnswerDto) {
    return this.PosttestAnswerService.create(createPosttestAnswerDto);
  }

  @Get()
  @Permissions('posttest-answers:read')
  findAll(@Query() query: Record<string,string>) {
    return this.PosttestAnswerService.findAll(query);
  }

  @Get(':id')
  @Permissions('posttest-answers:read')
  findOne(@Param('id') id: string) {
    return this.PosttestAnswerService.findOne(id);
  }

  @Delete(':id')
  @Permissions('posttest-answers:dalete')
  remove(@Param('id') id: string) {
    return this.PosttestAnswerService.remove(id);
  }
}
