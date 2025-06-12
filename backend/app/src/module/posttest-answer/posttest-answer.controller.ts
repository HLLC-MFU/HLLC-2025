import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PosttestAnswerService } from './posttest-answer.service';
import { CreatePosttestAnswerDto } from './dto/create-posttest-answer.dto';
import { UpdatePosttestAnswerDto } from './dto/update-posttest-answer.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('post-test-answers')
@Controller('post-test-answers')
export class PostTestAnswerController {
  constructor(private readonly PosttestAnswerService: PosttestAnswerService) {}

  @Post()
  @Permissions('post-test-answers:create')
  create(@Body() createPosttestAnswerDto: CreatePosttestAnswerDto) {
    return this.PosttestAnswerService.create(createPosttestAnswerDto);
  }

  @Get()
  @Permissions('post-test-answers:read')
  findAll(@Query() query: Record<string,string>) {
    return this.PosttestAnswerService.findAll(query);
  }

  @Get(':id')
  @Permissions('post-test-answers:read')
  findOne(@Param('id') id: string) {
    return this.PosttestAnswerService.findOne(id);
  }

  @Patch(':id')
  @Permissions('post-test-answers:update')
  update(@Param('id') id: string, @Body() updatePostTestAnswerDto: UpdatePosttestAnswerDto) {
    return this.PosttestAnswerService.update(id, updatePostTestAnswerDto);
  }

  @Delete(':id')
  @Permissions('post-test-answers:dalete')
  remove(@Param('id') id: string) {
    return this.PosttestAnswerService.remove(id);
  }
}
