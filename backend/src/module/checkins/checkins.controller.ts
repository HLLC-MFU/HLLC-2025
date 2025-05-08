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
import { ProcessCheckinDto, UpdateCheckinDto, CheckoutDto } from './dto/update-checkin.dto';
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
   * Create a new checkin
   */
  @Post()
  @NoCache()
  @Permissions('checkins:create')
  create(@Body() createCheckinDto: CreateCheckinDto, @Request() req) {
    return this.checkinsService.create(createCheckinDto, req.user?._id);
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
    @Query('populate') populate?: string,
  ) {
    const filters: Record<string, any> = {};
    
    // Add filters if provided
    if (activityId) filters.activity = activityId;
    if (userId) filters.user = userId;
    if (status) filters.status = status;
    
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
      populateArray
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
      populateArray
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
   * Process a checkin (approve, reject, complete)
   */
  @Patch(':id/process')
  @NoCache()
  @Permissions('checkins:update')
  @HttpCode(200)
  processCheckin(
    @Param('id') id: string,
    @Body() processCheckinDto: ProcessCheckinDto,
    @Request() req
  ) {
    if (!req.user?._id) {
      throw new BadRequestException('Staff ID is required to process checkins');
    }
    
    return this.checkinsService.processCheckin(id, processCheckinDto, req.user._id);
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
   * Get checkin statistics
   */
  @Get('stats/summary')
  @CacheTTL(300) // 5 minutes cache TTL
  @Permissions('checkins:read')
  getStats(@Query('activityId') activityId?: string) {
    return this.checkinsService.getCheckinStats(activityId);
  }
}
