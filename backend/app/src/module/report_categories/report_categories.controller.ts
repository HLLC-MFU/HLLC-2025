import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReportCategoriesService } from './report_categories.service';
import { CreateReportCategoryDto } from './dto/create-report_category.dto';
import { UpdateReportCategoryDto } from './dto/update-report_category.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('categories')
export class ReportCategoriesController {
  constructor(private readonly reportCategoriesService: ReportCategoriesService) { }

  @Post()
  @Public()
  create(@Body() createReportCategoryDto: CreateReportCategoryDto) {
    return this.reportCategoriesService.create(createReportCategoryDto);
  }

  @Get()
  @Public()
  findAll(@Query() query: Record<string, any>) {
    return this.reportCategoriesService.findAll(query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.reportCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateReportCategoryDto: UpdateReportCategoryDto) {
    return this.reportCategoriesService.update(id, updateReportCategoryDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.reportCategoriesService.remove(id);
  }
}
