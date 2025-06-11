import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LamduanFlowersService } from './lamduan-flowers.service';
import { CreateLamduanFlowerDto } from './dto/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from './dto/update-lamduan-flower.dto';

@Controller('lamduan-flowers')
export class LamduanFlowersController {
  constructor(private readonly lamduanFlowersService: LamduanFlowersService) {}

  @Post()
  create(@Body() createLamduanFlowerDto: CreateLamduanFlowerDto) {
    return this.lamduanFlowersService.create(createLamduanFlowerDto);
  }

  @Get()
  findAll() {
    return this.lamduanFlowersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lamduanFlowersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLamduanFlowerDto: UpdateLamduanFlowerDto) {
    return this.lamduanFlowersService.update(+id, updateLamduanFlowerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lamduanFlowersService.remove(+id);
  }
}
