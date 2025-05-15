import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateActiviteDto } from './dto/create-activite.dto';
import { UpdateActiviteDto } from './dto/update-activite.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Activity, ActivityDocument } from './schemas/activities.schema';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { User, UserDocument } from '../users/schemas/user.schema';
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';
import { FilterMap } from 'src/pkg/types/common.types';

@Injectable()
export class ActivitesService {
  private readonly logger = new Logger(ActivitesService.name);
  private readonly ACTIVITY_CACHE_PREFIX = 'activity:';
  private readonly ACTIVITIES_LIST_CACHE_KEY = 'activities:list';
  private readonly ACTIVITIES_TYPES_CACHE_KEY = 'activities:types';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create a new activity
   */
  async create(createActiviteDto: CreateActiviteDto, userId?: string) {
    this.logger.log(`Creating new activity of type: ${createActiviteDto.type}`);
    
    try {
      // Set creator if provided
      if (userId) {
        createActiviteDto.createdBy = userId;
      }
      
      // Create the activity
      const newActivity = new this.activityModel(createActiviteDto);
      const savedActivity = await newActivity.save();
      
      // Invalidate cache
      await this.invalidateActivityCache();
      
      return savedActivity.toObject();
    } catch (error) {
      this.logger.error(`Failed to create activity: ${error.message}`, error.stack);
      
      if (error.code === 11000) {
        throw new BadRequestException('Activity with this name already exists');
      }
      
      throw error;
    }
  }

  /**
   * Find all activities with pagination and filters
   */
  async findAll(
    filters: FilterMap<string | boolean | string[] | object> = {},
    page = 1,
    limit = 10,
    populate: string[] = []
  ) {
    const cacheKey = this.buildCacheKey('list', { filters, page, limit, populate });
    
    // Try to get from cache first
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for activities list with key: ${cacheKey}`);
      return cachedResult;
    }
    
    this.logger.debug(`Cache miss for activities list, fetching from database`);
    
    // Build query
    const query = this.buildQuery(filters as Partial<Record<string, string | boolean | string[]>>);
    
    // Execute with pagination
    const skip = (page - 1) * limit;
    
    const [activities, total, latest] = await Promise.all([
      this.activityModel.find(query)
        .populate(populate)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.activityModel.countDocuments(query),
      this.activityModel.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean() as Promise<{ updatedAt?: Date } | null>
    ]);
    
    const lastUpdatedAt = latest && latest.updatedAt 
      ? latest.updatedAt.toISOString() 
      : new Date().toISOString();
    
    // Prepare response with pagination
    const result = buildPaginatedResponse(activities, {
      page,
      limit,
      total,
      lastUpdatedAt
    });
    
    // Store in cache
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    
    return result;
  }

  /**
   * Find one activity by ID
   */
  async findOne(id: string, populate: string[] = []) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid activity ID format');
    }
    
    const cacheKey = `${this.ACTIVITY_CACHE_PREFIX}${id}`;
    
    // Try to get from cache first
    const cachedActivity = await this.cacheManager.get(cacheKey);
    if (cachedActivity) {
      this.logger.debug(`Cache hit for activity: ${id}`);
      return cachedActivity;
    }
    
    this.logger.debug(`Cache miss for activity ${id}, fetching from database`);
    
    // Find in database
    const activity = await this.activityModel.findById(id)
      .populate(populate)
      .lean();
    
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    
    // Store in cache
    await this.cacheManager.set(cacheKey, activity, this.CACHE_TTL);
    
    return activity;
  }

  /**
   * Update an activity
   */
  async update(id: string, updateActivityDto: UpdateActiviteDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid activity ID format');
    }
    
    this.logger.log(`Updating activity: ${id}`);
    
    // Find and update
    const updatedActivity = await this.activityModel.findByIdAndUpdate(
      id,
      updateActivityDto,
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedActivity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    
    // Invalidate cache
    await this.invalidateActivityCache(id);
    
    return updatedActivity;
  }

  /**
   * Remove an activity
   */
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid activity ID format');
    }
    
    this.logger.log(`Removing activity: ${id}`);
    
    const deletedActivity = await this.activityModel.findByIdAndDelete(id).lean();
    
    if (!deletedActivity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    
    // Invalidate cache
    await this.invalidateActivityCache(id);
    
    return deletedActivity;
  }

  /**
   * Get all activity types (for filters/dropdowns)
   */
  async getActivityTypes() {
    // Try to get from cache first
    const cachedTypes = await this.cacheManager.get(this.ACTIVITIES_TYPES_CACHE_KEY);
    if (cachedTypes) {
      return cachedTypes;
    }
    
    // Get distinct types from database
    const types = await this.activityModel.distinct('type');
    
    // Store in cache
    await this.cacheManager.set(this.ACTIVITIES_TYPES_CACHE_KEY, types, this.CACHE_TTL);
    
    return types;
  }

  /**
   * Update activity status (open, in progress, visible)
   */
  async updateStatus(id: string, statusUpdate: {
    isOpen?: boolean;
    isInProgress?: boolean;
    isVisible?: boolean;
  }) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid activity ID format');
    }
    
    this.logger.log(`Updating activity status: ${id}`);
    
    const activity = await this.activityModel.findById(id);
    
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    
    // Update status fields
    if (statusUpdate.isOpen !== undefined) activity.isOpen = statusUpdate.isOpen;
    if (statusUpdate.isInProgress !== undefined) activity.isInProgress = statusUpdate.isInProgress;
    if (statusUpdate.isVisible !== undefined) activity.isVisible = statusUpdate.isVisible;
    
    const updatedActivity = await activity.save();
    
    // Invalidate cache
    await this.invalidateActivityCache(id);
    
    return updatedActivity.toObject();
  }

  /**
   * Search activities by text
   */
  async searchActivities(searchTerm: string, page = 1, limit = 10) {
    const cacheKey = this.buildCacheKey('search', { searchTerm, page, limit });
    
    // Try to get from cache first
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Search in database
    const [activities, total] = await Promise.all([
      this.activityModel.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.activityModel.countDocuments({ $text: { $search: searchTerm } })
    ]);
    
    // Prepare response with pagination
    const result = buildPaginatedResponse(activities, {
      page,
      limit,
      total,
      lastUpdatedAt: new Date().toISOString()
    });
    
    // Store in cache (shorter TTL for search)
    await this.cacheManager.set(cacheKey, result, 600); // 10 minutes
    
    return result;
  }

  // --- Helper Methods ---

  /**
   * Build query from filters
   */
  private buildQuery(filters: Partial<Record<string, string | string[] | boolean>>) {
    const query: Record<string, any> = {};
    
    // Process specific filters
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.isOpen !== undefined) {
      query.isOpen = filters.isOpen === 'true';
    }
    
    if (filters.isInProgress !== undefined) {
      query.isInProgress = filters.isInProgress === 'true';
    }
    
    if (filters.isVisible !== undefined) {
      query.isVisible = filters.isVisible === 'true';
    }
    
    if (filters.tags) {
      query.tags = { $in: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
    }
    
    // Date range filters for registration
    if (filters.registrationAfter) {
      query['settings.registrationPeriod.start'] = { $gte: new Date(filters.registrationAfter as string) };
    }
    
    if (filters.registrationBefore) {
      query['settings.registrationPeriod.end'] = { $lte: new Date(filters.registrationBefore as string) };
    }
    
    // Date range filters for activity period
    if (filters.activityAfter) {
      query['settings.activityPeriod.start'] = { $gte: new Date(filters.activityAfter as string) };
    }
    
    if (filters.activityBefore) {
      query['settings.activityPeriod.end'] = { $lte: new Date(filters.activityBefore as string) };
    }
    
    return query;
  }

  /**
   * Build cache key based on parameters
   */
  private buildCacheKey(prefix: string, params: Record<string, any>): string {
    const paramsStr = Object.entries(params)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}=${JSON.stringify(value)}`;
        }
        return `${key}=${value}`;
      })
      .join('&');
    
    return `${this.ACTIVITY_CACHE_PREFIX}${prefix}:${paramsStr}`;
  }

  /**
   * Invalidate activity cache
   */
  private async invalidateActivityCache(id?: string) {
    // Clear specific activity if ID provided
    if (id) {
      await this.cacheManager.del(`${this.ACTIVITY_CACHE_PREFIX}${id}`);
    }
    
    // Clear list cache
    await this.cacheManager.del(this.ACTIVITIES_LIST_CACHE_KEY);
    
    // Clear types cache
    await this.cacheManager.del(this.ACTIVITIES_TYPES_CACHE_KEY);
    
    // Try to clear pattern-based cache keys
    try {
      const store = this.cacheManager.store as any;
      if (store && typeof store.keys === 'function') {
        const keys = await store.keys(`${this.ACTIVITY_CACHE_PREFIX}*`);
        if (keys && keys.length) {
          await Promise.all(keys.map(key => this.cacheManager.del(key)));
        }
      }
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
    }
  }
}
