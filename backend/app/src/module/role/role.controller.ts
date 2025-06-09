import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMetadataSchemaDto } from './dto/update-metadata-schema.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Public()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Put(':id/metadata-schema')
  updateMetadataSchema(
    @Param('id') id: string,
    @Body() dto: UpdateMetadataSchemaDto,
  ) {
    return this.roleService.updateMetadataSchema(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  /**
   * ตรวจสอบว่า role สามารถ scan อีก role ได้หรือไม่
   * GET /roles/can-scan?scanner=mentor&target=student
   */
  @Get('can-scan')
  async checkCanScan(
    @Query('scanner') scannerRole: string,
    @Query('target') targetRole: string,
  ) {
    if (!scannerRole || !targetRole) {
      throw new BadRequestException('Scanner role and target role are required');
    }

    const canScan = await this.roleService.canScan(scannerRole, targetRole);
    return {
      scanner: scannerRole,
      target: targetRole,
      canScan,
    };
  }

  /**
   * ดึงรายชื่อ roles ที่สามารถ scan ได้
   * GET /roles/mentor/scannable-roles
   */
  @Get(':roleName/scannable-roles')
  async getScannableRoles(@Param('roleName') roleName: string) {
    const roles = await this.roleService.getCanScanRoles(roleName);
    return {
      role: roleName,
      canScan: roles,
    };
  }
}
