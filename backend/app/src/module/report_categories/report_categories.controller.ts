import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReportCategoriesService } from './report_categories.service';
import { CreateReportCategoryDto } from './dto/create-report_category.dto';
import { UpdateReportCategoryDto } from './dto/update-report_category.dto';

@Controller('categories')
export class ReportCategoriesController {
  constructor(private readonly reportCategoriesService: ReportCategoriesService) { }

  @Post()
  create(@Body() createReportCategoryDto: CreateReportCategoryDto) {
    return this.reportCategoriesService.create(createReportCategoryDto);
  }

  @Get()
  findAll() {
    return this.reportCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportCategoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportCategoryDto: UpdateReportCategoryDto) {
    return this.reportCategoriesService.update(id, updateReportCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportCategoriesService.remove(id);
  }
}
