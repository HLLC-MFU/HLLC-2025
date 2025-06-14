import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query, Req, UseGuards } from '@nestjs/common';
import { LamduanFlowersService } from './lamduan-flowers.service';
import { CreateLamduanFlowerDto } from './dto/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from './dto/update-lamduan-flower.dto';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('lamduan-flowers')
export class LamduanFlowersController {
  constructor(private readonly lamduanFlowersService: LamduanFlowersService) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Body() createLamduanFlowerDto: CreateLamduanFlowerDto) {
    return this.lamduanFlowersService.create(createLamduanFlowerDto);
  }

  @Get()
  @Permissions('lamduan-flow:read')
  findAll(@Query() query: Record<string, string>) {
    return this.lamduanFlowersService.findAll(query);
  }

  @Get(':id')
  @Permissions('lamduan-flow:read:id')
  findOne(@Param('id') id: string) {
    return this.lamduanFlowersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('lamduan-flow:update')
  @UseInterceptors(new MultipartInterceptor(500))
  update(@Param('id') id: string, @Req() req: FastifyRequest) {
    const dto = req.body as UpdateLamduanFlowerDto;
    return this.lamduanFlowersService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('lamduan-flow:delete')
  remove(@Param('id') id: string) {
    return this.lamduanFlowersService.remove(id);
  }
}
