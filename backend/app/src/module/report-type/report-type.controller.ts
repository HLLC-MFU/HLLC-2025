import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReportTypeService } from './report-type.service';
import { CreateReportTypeDto } from './dto/create-type.dto';
import { UpdateReportTypeDto } from './dto/update-report_category.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('report-types')
export class ReportTypeController {
  constructor(private readonly reportTypeService: ReportTypeService) { }

  @Post()
  @Public()
  create(@Body() createReportTypeDto: CreateReportTypeDto) {
    return this.reportTypeService.create(createReportTypeDto);
  }

  @Get()
  @Public()
  findAll(@Query() query: Record<string, string>) {
    return this.reportTypeService.findAll(query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.reportTypeService.findOne(id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateReportTypeDto: UpdateReportTypeDto) {
    return this.reportTypeService.update(id, updateReportTypeDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.reportTypeService.remove(id);
  }
}
