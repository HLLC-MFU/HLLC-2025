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
  HttpCode,
  UseInterceptors,
  BadRequestException
} from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto, VerifyCheckinDto, BatchCheckinDto } from './dto/update-checkin.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleCacheInterceptor, CacheTTL, NoCache } from '../../pkg/interceptors/module-cache.interceptor';

@Controller('checkins')
@UseGuards(PermissionsGuard)
@UseInterceptors(ModuleCacheInterceptor)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  /**
   * Create a new checkin via QR code scan
   */
  @Post()
  @NoCache()
  @Permissions('checkins:create')
  async create(@Body() createCheckinDto: CreateCheckinDto, @Request() req) {
    return this.checkinsService.create(createCheckinDto, req.user?._id);
  }

  /**
   * Generate QR code for a user to check in to an activity
   */
  @Get('qrcode/:userId/:activityId')
  @CacheTTL(300) // 5 minutes cache TTL
  @Permissions('checkins:generate')
  generateQrCode(
    @Param('userId') userId: string,
    @Param('activityId') activityId: string
  ) {
    return this.checkinsService.generateQrCode(userId, activityId);
  }

  /**
   * Process offline batch of check-ins from staff devices
   */
  @Post('batch')
  @NoCache()
  @Permissions('checkins:create')
  processBatchCheckins(@Body() batchDto: BatchCheckinDto, @Request() req) {
    return this.checkinsService.processBatchCheckins(batchDto, req.user?._id);
  }

  /**
   * Verify a check-in (for staff members)
   */
  @Patch(':id/verify')
  @NoCache()
  @Permissions('checkins:verify')
  @HttpCode(200)
  verifyCheckin(
    @Param('id') id: string,
    @Body() verifyDto: VerifyCheckinDto,
    @Request() req
  ) {
    if (!req.user?._id) {
      throw new BadRequestException('Staff ID is required to verify check-ins');
    }
    
    return this.checkinsService.verifyCheckin(id, verifyDto, req.user._id);
  }

  /**
   * Get all checkins with pagination and filters
   */
  @Get()
  @CacheTTL(60) // 1 minute cache TTL
  @Permissions('checkins:read')
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('activity') activityId?: string,
    @Query('user') userId?: string,
    @Query('status') status?: string,
    @Query('isCheckedIn') isCheckedIn?: boolean,
    @Query('populate') populate?: string,
  ) {
    const filters: Record<string, any> = {};
    
    // Add filters if provided
    if (activityId) filters.activity = activityId;
    if (userId) filters.user = userId;
    if (status) filters.status = status;
    if (isCheckedIn !== undefined) filters.isCheckedIn = isCheckedIn;
    
    // Parse populate
    let populateArray: string[] = [];
    if (populate) {
      populateArray = Array.isArray(populate) 
        ? populate 
        : populate.split(',');
    }
    
    return this.checkinsService.findAll(
      filters, 
      +page, 
      +limit,
      populateArray
    );
  }

  /**
   * Get checkins for a specific activity
   */
  @Get('activity/:activityId')
  @CacheTTL(60) // 1 minute cache TTL
  @Permissions('checkins:read')
  findByActivity(
    @Param('activityId') activityId: string,
    @Query('status') status?: string,
    @Query('isCheckedIn') isCheckedIn?: boolean,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('populate') populate?: string,
  ) {
    // Parse populate
    let populateArray: string[] = [];
    if (populate) {
      populateArray = Array.isArray(populate) 
        ? populate 
        : populate.split(',');
    }
    
    return this.checkinsService.findByActivity(
      activityId,
      status,
      +page,
      +limit,
      populateArray,
      isCheckedIn
    );
  }

  /**
   * Get checkins for a specific user
   */
  @Get('user/:userId')
  @CacheTTL(60) // 1 minute cache TTL
  @Permissions('checkins:read')
  findByUser(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('isCheckedIn') isCheckedIn?: boolean,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('populate') populate?: string,
  ) {
    // Parse populate
    let populateArray: string[] = [];
    if (populate) {
      populateArray = Array.isArray(populate) 
        ? populate 
        : populate.split(',');
    }
    
    return this.checkinsService.findByUser(
      userId,
      status,
      +page,
      +limit,
      populateArray,
      isCheckedIn
    );
  }

  /**
   * Get a specific checkin by ID
   */
  @Get(':id')
  @CacheTTL(300) // 5 minutes cache TTL
  @Permissions('checkins:read')
  findOne(
    @Param('id') id: string,
    @Query('populate') populate?: string,
  ) {
    // Parse populate
    let populateArray: string[] = [];
    if (populate) {
      populateArray = Array.isArray(populate) 
        ? populate 
        : populate.split(',');
    }
    
    return this.checkinsService.findOne(id, populateArray);
  }

  /**
   * Update a checkin
   */
  @Patch(':id')
  @NoCache()
  @Permissions('checkins:update')
  update(@Param('id') id: string, @Body() updateCheckinDto: UpdateCheckinDto) {
    return this.checkinsService.update(id, updateCheckinDto);
  }

  /**
   * Delete a checkin
   */
  @Delete(':id')
  @NoCache()
  @Permissions('checkins:delete')
  remove(@Param('id') id: string) {
    return this.checkinsService.remove(id);
  }

  /**
   * Get check-in statistics
   */
  @Get('stats/summary')
  @CacheTTL(300) // 5 minutes cache TTL
  @Permissions('checkins:read')
  getStats(@Query('activityId') activityId?: string) {
    return this.checkinsService.getCheckinStats(activityId);
  }
}
