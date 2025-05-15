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
  UseInterceptors
} from '@nestjs/common';
import { ActivitesService } from './activites.service';
import { CreateActiviteDto } from './dto/create-activite.dto';
import { UpdateActiviteDto } from './dto/update-activite.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleCacheInterceptor, CacheTTL, NoCache } from '../../pkg/interceptors/module-cache.interceptor';
import { FilterMap } from 'src/pkg/types/common.types';

@Controller('activities')
@UseGuards(PermissionsGuard)
@UseInterceptors(ModuleCacheInterceptor)
export class ActivitesController {
  constructor(private readonly activitesService: ActivitesService) {}

  /**
   * Create a new activity
   */
  @Post()
  @NoCache()
  @Permissions('activities:create')
  create(@Body() createActiviteDto: CreateActiviteDto, @Request() req) {
    return this.activitesService.create(createActiviteDto, req.user?._id);
  }

  /**
   * Get all activities with pagination and filters
   */
  @Get()
  @CacheTTL(60) // 1 minute cache TTL
  @Public()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('isOpen') isOpen?: string,
    @Query('isVisible') isVisible?: string,
    @Query('isInProgress') isInProgress?: string,
    @Query('tags') tags?: string[],
    @Query('populate') populate?: string,
  ) {
    const filters: FilterMap<string | boolean | string[] | object> = {};
    
    // Add filters if provided
    if (type) filters.type = type;
    if (isOpen !== undefined) filters.isOpen = isOpen;
    if (isVisible !== undefined) filters.isVisible = isVisible;
    if (isInProgress !== undefined) filters.isInProgress = isInProgress;
    if (tags) filters.tags = tags;
    
    // Parse populate
    let populateArray: string[] = [];
    if (populate) {
      populateArray = Array.isArray(populate) 
        ? populate 
        : populate.split(',');
    }
    
    return this.activitesService.findAll(
      filters, 
      +page, 
      +limit,
      populateArray
    );
  }

  /**
   * Get a specific activity by ID
   */
  @Get(':id')
  @CacheTTL(300) // 5 minutes cache TTL
  @Public()
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
    
    return this.activitesService.findOne(id, populateArray);
  }

  /**
   * Update an activity
   */
  @Patch(':id')
  @NoCache()
  @Permissions('activities:update')
  update(@Param('id') id: string, @Body() updateActiviteDto: UpdateActiviteDto) {
    return this.activitesService.update(id, updateActiviteDto);
  }

  /**
   * Delete an activity
   */
  @Delete(':id')
  @NoCache()
  @Permissions('activities:delete')
  remove(@Param('id') id: string) {
    return this.activitesService.remove(id);
  }

  /**
   * Get all available activity types
   */
  @Get('types/all')
  @CacheTTL(3600) // 1 hour cache TTL
  @Public()
  getActivityTypes() {
    return this.activitesService.getActivityTypes();
  }

  /**
   * Update activity status
   */
  @Patch(':id/status')
  @NoCache()
  @Permissions('activities:update')
  @HttpCode(200)
  updateStatus(
    @Param('id') id: string,
    @Body() statusUpdate: {
      isOpen?: boolean;
      isInProgress?: boolean;
      isVisible?: boolean;
    }
  ) {
    return this.activitesService.updateStatus(id, statusUpdate);
  }

  /**
   * Search activities
   */
  @Get('search/text')
  @CacheTTL(300) // 5 minutes cache TTL
  @Public()
  search(
    @Query('q') searchTerm: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.activitesService.searchActivities(searchTerm, +page, +limit);
  }
}
