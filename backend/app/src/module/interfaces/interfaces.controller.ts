import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CreateInterfacesDto } from './dto/create-interfaces.dto';
import { UpdateInterfacesDto } from './dto/update-interfaces.dto';
import { InterfacesService } from './interfaces.service';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';

@Controller('interfaces')
export class InterfaceController {
  constructor(private readonly InterfacesService: InterfacesService) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Body() createInterfacesDto: CreateInterfacesDto) {
    return this.InterfacesService.create(createInterfacesDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.InterfacesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.InterfacesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(new MultipartInterceptor(500))
  update(
    @Param('id') id: string,
    @Body() updateInterfacesDto: UpdateInterfacesDto,
  ) {
    return this.InterfacesService.update(id, updateInterfacesDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.InterfacesService.remove(id);
  }
}
