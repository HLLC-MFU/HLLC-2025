import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SponsorsTypeService } from "./sponsors-type.service";
import { CreateSponsorsTypeDto } from "./dto/create-sponsors-type.dto";
import { UpdateSponsorsTypeDto } from "./dto/update-sponsors-type.dto";

@Controller('sponsors-type')
export class SponsorsTypeController {

  constructor(private readonly sponsorsTypeService: SponsorsTypeService) {}
  
  @Post()
  create(@Body() createSponsorsTypeDto: CreateSponsorsTypeDto) {
    return this.sponsorsTypeService.create(createSponsorsTypeDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.sponsorsTypeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sponsorsTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSponsorsTypeDto: UpdateSponsorsTypeDto) {
    return this.sponsorsTypeService.update(id, updateSponsorsTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sponsorsTypeService.remove(id);
  }
}