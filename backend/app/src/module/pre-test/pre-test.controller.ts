import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { PreTestService } from './pre-test.service';
import { CreatePreTestDto } from './dto/create-pre-test.dto';
import { UpdatePreTestDto } from './dto/update-pre-test.dto';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';

@UseGuards(PermissionsGuard)
@ApiTags('post-tests')
@Controller('pre-tests')
export class PreTestController {
  constructor(private readonly preTestService: PreTestService) { }

  @UseInterceptors(new MultipartInterceptor())
  @Post()
  @Permissions('pre-tests:create')
  create(@Body() createPreTestDto: CreatePreTestDto) {
    return this.preTestService.create(createPreTestDto);
  }

  @Get()
  @Permissions('pre-tests:read')
  findAll(@Query() query: Record<string, string>) {
    return this.preTestService.findAll(query);
  }

  @Get(':id')
  @Permissions('pre-tests:read')
  findOne(@Param('id') id: string) {
    return this.preTestService.findOne(id);
  }

  @UseInterceptors(new MultipartInterceptor())
  @Patch(':id')
  @Permissions('pre-tests:update')
  update(@Param('id') id: string, @Body() updatePreTestDto: UpdatePreTestDto) {
    return this.preTestService.update(id, updatePreTestDto);
  }

  @Delete(':id')
  @Permissions('pre-tests:dalete')
  remove(@Param('id') id: string) {
    return this.preTestService.remove(id);
  }
}
