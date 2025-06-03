import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReportTypeService } from './report-type.service';
import { CreateReportTypeDto } from './dto/create-type.dto';
import { UpdateReportTypeDto } from './dto/update-report_category.dto';

@Controller('report-types')
export class ReportTypeController {
  constructor(private readonly reportTypeService: ReportTypeService) { }

  @Post()
  create(@Body() createReportTypeDto: CreateReportTypeDto) {
    return this.reportTypeService.create(createReportTypeDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.reportTypeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportTypeDto: UpdateReportTypeDto) {
    return this.reportTypeService.update(id, updateReportTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportTypeService.remove(id);
  }
}
