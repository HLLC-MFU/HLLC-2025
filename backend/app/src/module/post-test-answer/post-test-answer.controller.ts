import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { PostTestAnswerService } from './post-test-answer.service';
import { CreatePostTestAnswerDto } from './dto/create-post-test-answer.dto';
import { UpdatePostTestAnswerDto } from './dto/update-post-test-answer.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@ApiTags('post-test-answers')
@Controller('post-test-answers')
export class PostTestAnswerController {
  constructor(private readonly postTestAnswerService: PostTestAnswerService) {}

  @Post()
  @Permissions('post-test-answers:create')
  create(@Body() createPostTestAnswerDto: CreatePostTestAnswerDto) {
    return this.postTestAnswerService.create(createPostTestAnswerDto);
  }

  @Get()
  @Permissions('post-test-answers:read')
  findAll(@Query() query: Record<string,string>) {
    return this.postTestAnswerService.findAll(query);
  }

  @Get(':id')
  @Permissions('post-test-answers:read')
  findOne(@Param('id') id: string) {
    return this.postTestAnswerService.findOne(id);
  }

  @Patch(':id')
  @Permissions('post-test-answers:update')
  update(@Param('id') id: string, @Body() updatePostTestAnswerDto: UpdatePostTestAnswerDto) {
    return this.postTestAnswerService.update(id, updatePostTestAnswerDto);
  }

  @Delete(':id')
  @Permissions('post-test-answers:dalete')
  remove(@Param('id') id: string) {
    return this.postTestAnswerService.remove(id);
  }
}
