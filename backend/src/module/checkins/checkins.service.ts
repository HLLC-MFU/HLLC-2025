import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { ProcessCheckinDto, UpdateCheckinDto, CheckoutDto } from './dto/update-checkin.dto';
import { Checkin, CheckinDocument } from './schemas/checkins.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Activity, ActivityDocument } from '../activites/schemas/activities.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';

@Injectable()
export class CheckinsService {
  private readonly logger = new Logger(CheckinsService.name);
  private readonly CHECKIN_CACHE_PREFIX = 'checkin:';
  private readonly CHECKINS_LIST_CACHE_KEY = 'checkins:list';
  private readonly CHECKINS_STATS_CACHE_KEY = 'checkins:stats';
  private readonly CACHE_TTL = 1800; // 30 minutes in seconds

  constructor(
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create a new checkin for a user at an activity
   */
  async create(createCheckinDto: CreateCheckinDto, staffId?: string) {
    this.logger.log(`Creating new checkin for user ${createCheckinDto.user} at activity ${createCheckinDto.activity}`);
    
    try {
      // Validate that the activity exists
      const activity = await this.activityModel.findById(createCheckinDto.activity);
      if (!activity) {
        throw new NotFoundException(`Activity with ID ${createCheckinDto.activity} not found`);
      }
      
      // Validate that the user exists
      const user = await this.userModel.findById(createCheckinDto.user);
      if (!user) {
        throw new NotFoundException(`User with ID ${createCheckinDto.user} not found`);
      }
      
      // Set staff who processed this checkin if provided
      if (staffId) {
        createCheckinDto.processedBy = staffId;
        createCheckinDto.processedAt = new Date().toISOString();
      }
      
      // Check if checkin already exists for this user and activity
      const existingCheckin = await this.checkinModel.findOne({
        user: createCheckinDto.user,
        activity: createCheckinDto.activity
      });
      
      if (existingCheckin) {
        throw new BadRequestException('User is already checked in for this activity');
      }
      
      // Create the checkin
      const newCheckin = new this.checkinModel(createCheckinDto);
      const savedCheckin = await newCheckin.save();
      
      // Invalidate cache
      await this.invalidateCheckinCache();
      
      return savedCheckin.toObject();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to create checkin: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create checkin: ${error.message}`);
    }
  }

  /**
   * Find all checkins with pagination and filters
   */
  async findAll(
    filters: Record<string, any> = {},
    page = 1,
    limit = 10,
    populate: string[] = []
  ) {
    const cacheKey = this.buildCacheKey('list', { filters, page, limit, populate });
    
    // Try to get from cache first
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for checkins list with key: ${cacheKey}`);
      return cachedResult;
    }
    
    this.logger.debug(`Cache miss for checkins list, fetching from database`);
    
    // Build query
    const query = this.buildQuery(filters);
    
    // Execute with pagination
    const skip = (page - 1) * limit;
    
    const [checkins, total, latest] = await Promise.all([
      this.checkinModel.find(query)
        .populate(populate)
        .sort({ checkinTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.checkinModel.countDocuments(query),
      this.checkinModel.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean() as Promise<{ updatedAt?: Date } | null>
    ]);
    
    const lastUpdatedAt = latest && latest.updatedAt 
      ? latest.updatedAt.toISOString() 
      : new Date().toISOString();
    
    // Prepare response with pagination
    const result = buildPaginatedResponse(checkins, {
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
   * Find checkins by activity
   */
  async findByActivity(
    activityId: string,
    status?: string,
    page = 1,
    limit = 10,
    populate: string[] = []
  ) {
    if (!Types.ObjectId.isValid(activityId)) {
      throw new BadRequestException('Invalid activity ID format');
    }
    
    const filters: Record<string, any> = { activity: activityId };
    if (status) {
      filters.status = status;
    }
    
    return this.findAll(filters, page, limit, populate);
  }

  /**
   * Find checkins by user
   */
  async findByUser(
    userId: string,
    status?: string,
    page = 1,
    limit = 10,
    populate: string[] = []
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    
    const filters: Record<string, any> = { user: userId };
    if (status) {
      filters.status = status;
    }
    
    return this.findAll(filters, page, limit, populate);
  }

  /**
   * Find a specific checkin by ID
   */
  async findOne(id: string, populate: string[] = []) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid checkin ID format');
    }
    
    const cacheKey = `${this.CHECKIN_CACHE_PREFIX}${id}`;
    
    // Try to get from cache first
    const cachedCheckin = await this.cacheManager.get(cacheKey);
    if (cachedCheckin) {
      this.logger.debug(`Cache hit for checkin: ${id}`);
      return cachedCheckin;
    }
    
    this.logger.debug(`Cache miss for checkin ${id}, fetching from database`);
    
    // Find in database
    const checkin = await this.checkinModel.findById(id)
      .populate(populate)
      .lean();
    
    if (!checkin) {
      throw new NotFoundException(`Checkin with ID ${id} not found`);
    }
    
    // Store in cache
    await this.cacheManager.set(cacheKey, checkin, this.CACHE_TTL);
    
    return checkin;
  }

  /**
   * Update a checkin
   */
  async update(id: string, updateCheckinDto: UpdateCheckinDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid checkin ID format');
    }
    
    this.logger.log(`Updating checkin: ${id}`);
    
    // Find and update
    const updatedCheckin = await this.checkinModel.findByIdAndUpdate(
      id,
      updateCheckinDto,
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedCheckin) {
      throw new NotFoundException(`Checkin with ID ${id} not found`);
    }
    
    // Invalidate cache
    await this.invalidateCheckinCache(id);
    
    return updatedCheckin;
  }

  /**
   * Process a checkin (approve, reject, complete)
   */
  async processCheckin(id: string, processCheckinDto: ProcessCheckinDto, staffId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid checkin ID format');
    }
    
    this.logger.log(`Processing checkin ${id} with status: ${processCheckinDto.status} by staff ${staffId}`);
    
    const checkin = await this.checkinModel.findById(id);
    
    if (!checkin) {
      throw new NotFoundException(`Checkin with ID ${id} not found`);
    }
    
    // Update checkin status and staff info
    checkin.status = processCheckinDto.status;
    checkin.processedBy = new Types.ObjectId(staffId);
    checkin.processedAt = new Date();
    
    if (processCheckinDto.notes) {
      checkin.notes = processCheckinDto.notes;
    }
    
    const updatedCheckin = await checkin.save();
    
    // Invalidate cache
    await this.invalidateCheckinCache(id);
    
    return updatedCheckin.toObject();
  }


  /**
   * Remove a checkin
   */
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid checkin ID format');
    }
    
    this.logger.log(`Removing checkin: ${id}`);
    
    const deletedCheckin = await this.checkinModel.findByIdAndDelete(id).lean();
    
    if (!deletedCheckin) {
      throw new NotFoundException(`Checkin with ID ${id} not found`);
    }
    
    // Invalidate cache
    await this.invalidateCheckinCache(id);
    
    return deletedCheckin;
  }

  /**
   * Get checkin statistics
   */
  async getCheckinStats(activityId?: string) {
    const cacheKey = activityId 
      ? `${this.CHECKINS_STATS_CACHE_KEY}:activity:${activityId}`
      : this.CHECKINS_STATS_CACHE_KEY;
    
    // Try to get from cache first
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }
    
    // Build query
    const query: Record<string, any> = {};
    if (activityId) {
      if (!Types.ObjectId.isValid(activityId)) {
        throw new BadRequestException('Invalid activity ID format');
      }
      query.activity = new Types.ObjectId(activityId);
    }
    
    // Get stats from database
    const [
      totalCheckins,
      pendingCheckins,
      approvedCheckins,
      rejectedCheckins,
      completedCheckins
    ] = await Promise.all([
      this.checkinModel.countDocuments(query),
      this.checkinModel.countDocuments({ ...query, status: 'pending' }),
      this.checkinModel.countDocuments({ ...query, status: 'approved' }),
      this.checkinModel.countDocuments({ ...query, status: 'rejected' }),
      this.checkinModel.countDocuments({ ...query, status: 'completed' })
    ]);
    
    const stats = {
      total: totalCheckins,
      pending: pendingCheckins,
      approved: approvedCheckins,
      rejected: rejectedCheckins,
      completed: completedCheckins,
      approvalRate: totalCheckins > 0 
        ? ((approvedCheckins + completedCheckins) / totalCheckins * 100).toFixed(1) + '%'
        : '0%'
    };
    
    // Store in cache
    await this.cacheManager.set(cacheKey, stats, this.CACHE_TTL);
    
    return stats;
  }

  // --- Helper Methods ---

  /**
   * Build query from filters
   */
  private buildQuery(filters: Record<string, any>) {
    const query: Record<string, any> = {};
    
    // Process specific filters
    if (filters.activity) {
      query.activity = new Types.ObjectId(filters.activity);
    }
    
    if (filters.user) {
      query.user = new Types.ObjectId(filters.user);
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Date range filters for checkin time
    if (filters.checkinAfter) {
      query.checkinTime = { $gte: new Date(filters.checkinAfter) };
    }
    
    if (filters.checkinBefore) {
      query.checkinTime = { 
        ...query.checkinTime || {},
        $lte: new Date(filters.checkinBefore) 
      };
    }
    
    // Date range filters for checkout time
    if (filters.checkoutAfter) {
      query.checkoutTime = { $gte: new Date(filters.checkoutAfter) };
    }
    
    if (filters.checkoutBefore) {
      query.checkoutTime = { 
        ...query.checkoutTime || {},
        $lte: new Date(filters.checkoutBefore) 
      };
    }
    
    // Filter by processed staff
    if (filters.processedBy) {
      query.processedBy = new Types.ObjectId(filters.processedBy);
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
    
    return `${this.CHECKIN_CACHE_PREFIX}${prefix}:${paramsStr}`;
  }

  /**
   * Invalidate checkin cache
   */
  private async invalidateCheckinCache(id?: string) {
    // Clear specific checkin if ID provided
    if (id) {
      await this.cacheManager.del(`${this.CHECKIN_CACHE_PREFIX}${id}`);
    }
    
    // Clear list cache
    await this.cacheManager.del(this.CHECKINS_LIST_CACHE_KEY);
    
    // Clear stats cache
    await this.cacheManager.del(this.CHECKINS_STATS_CACHE_KEY);
    
    // Try to clear pattern-based cache keys
    try {
      const store = this.cacheManager.store as any;
      if (store && typeof store.keys === 'function') {
        const keys = await store.keys(`${this.CHECKIN_CACHE_PREFIX}*`);
        if (keys && keys.length) {
          await Promise.all(keys.map(key => this.cacheManager.del(key)));
        }
      }
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
    }
  }
}
