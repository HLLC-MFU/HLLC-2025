import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SponsorsTypeService } from "./sponsors-type.service";
import { CreateSponsorsTypeDto } from "./dto/create-sponsors-type.dto";
import { UpdateSponsorsTypeDto } from "./dto/update-sponsors-type.dto";
import { Permissions } from "../auth/decorators/permissions.decorator";


@Controller('sponsors-type')
export class SponsorsTypeController {

  constructor(private readonly sponsorsTypeService: SponsorsTypeService) {}
  
  @Post()
  @Permissions('sponsors-type:create')
  create(@Body() createSponsorsTypeDto: CreateSponsorsTypeDto) {
    return this.sponsorsTypeService.create(createSponsorsTypeDto);
  }

  @Get()
  @Permissions('sponsors-type:read')
  findAll(@Query() query: Record<string, string>) {
    return this.sponsorsTypeService.findAll(query);
  }

  @Get(':id')
  @Permissions('sponsors-type:read')
  findOne(@Param('id') id: string) {
    return this.sponsorsTypeService.findOne(id);
  }

  @Patch(':id')
  @Permissions('sponsors-type:update')
  update(@Param('id') id: string, @Body() updateSponsorsTypeDto: UpdateSponsorsTypeDto) {
    return this.sponsorsTypeService.update(id, updateSponsorsTypeDto);
  }

  @Delete(':id')
  @Permissions('sponsors-type:delete')
  remove(@Param('id') id: string) {
    return this.sponsorsTypeService.remove(id);
  }
}