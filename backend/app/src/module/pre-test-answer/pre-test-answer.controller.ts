import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PreTestAnswerService } from './pre-test-answer.service';
import { CreatePreTestAnswerDto } from './dto/create-pre-test-answer.dto';
import { UpdatePreTestAnswerDto } from './dto/update-pre-test-answer.dto';

@Controller('pre-test-answer')
export class PreTestAnswerController {
  constructor(private readonly preTestAnswerService: PreTestAnswerService) {}

  @Post()
  create(@Body() createPreTestAnswerDto: CreatePreTestAnswerDto) {
    return this.preTestAnswerService.create(createPreTestAnswerDto);
  }

  @Get()
  findAll() {
    return this.preTestAnswerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.preTestAnswerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePreTestAnswerDto: UpdatePreTestAnswerDto) {
    return this.preTestAnswerService.update(+id, updatePreTestAnswerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.preTestAnswerService.remove(+id);
  }
}
