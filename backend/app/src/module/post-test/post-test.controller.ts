import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { PosttestService } from './post-test.service';
import { CreatePosttestDto } from './dto/create-post-test.dto';
import { UpdatePosttestDto } from './dto/update-post-test.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';

@UseGuards(PermissionsGuard)
@ApiTags('post-tests')
@Controller('post-tests')
export class PosttestController {
  constructor(private readonly posttestService: PosttestService) {}

  @UseInterceptors(new MultipartInterceptor())
  @Post()
  @Permissions('post-tests:create')
  create(@Body() createPosttestDto: CreatePosttestDto) {
    return this.posttestService.create(createPosttestDto);
  }

  @Get()
  @Permissions('post-tests:read')
  findAll(@Query() query: Record<string, string>) {
    return this.posttestService.findAll(query);
  }

  @Get(':id')
  @Permissions('post-tests:read')
  findOne(@Param('id') id: string) {
    return this.posttestService.findOne(id);
  }

  @UseInterceptors(new MultipartInterceptor())
  @Patch(':id')
  @Permissions('post-tests:update')
  update(@Param('id') id: string, @Body() updatePosttestDto: UpdatePosttestDto) {
    return this.posttestService.update(id, updatePosttestDto);
  }

  @Delete(':id')
  @Permissions('post-tests:delete')
  remove(@Param('id') id: string) {
    return this.posttestService.remove(id);
  }
}
