import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReportTypeService } from './report-type.service';
import { CreateReportCategoryDto } from './dto/create-report_category.dto';
import { UpdateReportCategoryDto } from './dto/update-report_category.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('categories')
export class ReportTypeController {
  constructor(private readonly reportTypeService: ReportTypeService) { }

  @Post()
  @Public()
  create(@Body() createReportCategoryDto: CreateReportCategoryDto) {
    return this.reportTypeService.create(createReportCategoryDto);
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
  update(@Param('id') id: string, @Body() updateReportCategoryDto: UpdateReportCategoryDto) {
    return this.reportTypeService.update(id, updateReportCategoryDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.reportTypeService.remove(id);
  }
}
