import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

// Define the request user type
interface RequestWithUser extends Request {
  user: {
    _id: string;
    permissions: string[];
    role?: {
      name: string;
      permissions: string[];
    };
  };
}

@Controller('checkin')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Apply both JWT and Permission guards
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  @Permissions('checkin:create')
  async create(
    @Request() req: RequestWithUser,
    @Body() createCheckinDto: CreateCheckinDto,
  ) {
    // Verify that the user has the required permission
    if (!req.user.permissions.includes('checkin:create')) {
      throw new UnauthorizedException(
        'You do not have permission to create check-ins',
      );
    }

    // Set the staff ID from the authenticated user
    createCheckinDto.staff = req.user._id;

    return this.checkinService.create(createCheckinDto);
  }

  @Get()
  @Permissions('checkin:read')
  findAll(@Query() query: Record<string, string>) {
    return this.checkinService.findAll(query);
  }

  @Get(':id')
  @Permissions('checkin:read')
  findOne(@Param('id') id: string) {
    return this.checkinService.findOne(id);
  }

  @Patch(':id')
  @Permissions('checkin:update')
  update(@Param('id') id: string, @Body() updateCheckinDto: UpdateCheckinDto) {
    return this.checkinService.update(id, updateCheckinDto);
  }

  @Delete(':id')
  @Permissions('checkin:delete')
  remove(@Param('id') id: string) {
    return this.checkinService.remove(id);
  }
}
