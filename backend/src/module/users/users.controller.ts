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
  HttpCode,
  UseInterceptors
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SerializerInterceptor } from '../../pkg/interceptors/serializer.interceptor';
import { BulkUploadUsersDto } from './dto/bulk-upload-users.dto';
import { RemoveMultipleDto } from './dto/remove-multiple.dto';
import { QueryWithPagination } from '../../pkg/types/common.types';
/**
 * Users Controller
 * 
 * Handles all user-related HTTP endpoints including:
 * - User account management
 * - User data retrieval
 * - Bulk operations
 * - Password management
 */
@UseGuards(PermissionsGuard)
@Controller('users')
@UseInterceptors(SerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user
   */
  @Post()
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Get all users with optional filtering and pagination
   * 
   * @param query Filter, pagination, and exclusion parameters
   */
  @Get()
  @Permissions('users:read')
  async findAll(@Query() query: QueryWithPagination) {
    const { page = 1, limit, excluded = '', ...filters } = query;
    const excludedList = excluded.split(',').filter(Boolean);
    const parsedLimit = limit !== undefined ? +limit : undefined;
    const parsedPage = page !== undefined ? +page : 1;
  
    return this.usersService.findAll(filters, parsedPage, parsedLimit, excludedList);
  }

  /**
   * Find a user by their ID
   */
  @Get(':id')
  @Permissions('users:read:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Update a user's information
   */
  @Patch(':id')
  @Permissions('users:update:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Delete a user by ID
   */
  @Delete(':id')
  @Permissions('users:delete:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Reset a user's password to the default value
   */
  @Post(':id/reset-password')
  @HttpCode(200)
  @Permissions('users:update:id')
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }

  /**
   * Upload multiple users in bulk
   */
  @Post('upload')
  @Permissions('users:create')
  uploadUsers(@Body() uploadData: BulkUploadUsersDto) {
    return this.usersService.uploadUsers(uploadData);
  }

  /**
   * Get registration statistics
   */
  @Get('stats/registration')
  @Permissions('users:read')
  checkRegistrationStatus() {
    return this.usersService.checkRegistrationStatus();
  }

  /**
   * Find a user by their username (student ID)
   */
  @Get('by-username/:username')
  @Permissions('users:read')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  /**
   * Delete multiple users by ID
   */
  @Post('remove-multiple')
  @HttpCode(200)
  @Permissions('users:delete')
  removeMultiple(@Body() data: RemoveMultipleDto) {
    return this.usersService.removeMultiple(data.ids);
  }
}
