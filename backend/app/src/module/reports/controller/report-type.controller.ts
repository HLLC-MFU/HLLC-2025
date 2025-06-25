import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ReportTypeService } from '../service/report-type.service';
import { CreateReportTypeDto } from '../dto/reports-type/create-type.dto';
import { UpdateReportTypeDto } from '../dto/reports-type/update-type.dto';
import { Public } from 'src/module/auth/decorators/public.decorator';

@Controller('report-types')
export class ReportTypeController {
  constructor(private readonly reportTypeService: ReportTypeService) {}

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
  update(
    @Param('id') id: string,
    @Body() updateReportTypeDto: UpdateReportTypeDto,
  ) {
    return this.reportTypeService.update(id, updateReportTypeDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.reportTypeService.remove(id);
  }
}
