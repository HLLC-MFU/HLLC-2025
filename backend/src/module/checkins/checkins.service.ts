import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto, VerifyCheckinDto, BatchCheckinDto, OfflineCheckinDto } from './dto/update-checkin.dto';
import { Checkin, CheckinDocument } from './schemas/checkins.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Activity, ActivityDocument } from '../activites/schemas/activities.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';
import { createHash } from 'crypto';

@Injectable()
export class CheckinsService {
  private readonly logger = new Logger(CheckinsService.name);
  private readonly CHECKIN_CACHE_PREFIX = 'checkin:';
  private readonly CHECKINS_LIST_CACHE_KEY = 'checkins:list';
  private readonly CHECKINS_STATS_CACHE_KEY = 'checkins:stats';
  private readonly QRCODE_CACHE_PREFIX = 'qrcode:';
  private readonly CACHE_TTL = 1800; // 30 minutes in seconds
  private readonly QRCODE_TTL = 300; // 5 minutes for QR codes

  constructor(
    @InjectModel(Checkin.name) private checkinModel: Model<CheckinDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create a new check-in for a user at an activity (from QR code)
   */
  async create(createCheckinDto: CreateCheckinDto, staffId?: string) {
    this.logger.log(`Creating new check-in for user ${createCheckinDto.user} at activity ${createCheckinDto.activity}`);
    
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
      
      // Set staff who scanned this check-in if provided
      if (staffId) {
        createCheckinDto.scannedBy = staffId;
      }
      
      // Set processed time to now
      createCheckinDto.scanTime = new Date().toISOString();
      
      // Check if check-in already exists for this user and activity
      const existingCheckin = await this.checkinModel.findOne({
        user: createCheckinDto.user,
        activity: createCheckinDto.activity
      });
      
      if (existingCheckin) {
        // Update existing checkin status to duplicate
        existingCheckin.status = 'duplicate';
        await existingCheckin.save();
        
        throw new BadRequestException('User is already checked in for this activity');
      }
      
      // Set initial status and isCheckedIn flag
      createCheckinDto.status = 'success';
      createCheckinDto.isCheckedIn = true;
      
      // Create the check-in
      const newCheckin = new this.checkinModel({
        ...createCheckinDto,
        processedTime: new Date()
      });
      
      const savedCheckin = await newCheckin.save();
      
      // Invalidate cache
      await this.invalidateCheckinCache();
      
      return savedCheckin.toObject();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to create check-in: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create check-in: ${error.message}`);
    }
  }

  /**
   * Generate QR code data for a user to check in to an activity
   */
  async generateQrCode(userId: string, activityId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(activityId)) {
      throw new BadRequestException('Invalid user or activity ID format');
    }
    
    // Check if user and activity exist
    const [user, activity] = await Promise.all([
      this.userModel.findById(userId).select('_id name').lean(),
      this.activityModel.findById(activityId).select('_id name').lean(),
    ]);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    // Get activity name or title (depending on schema)
    const activityName = activity.name || 'Unknown Activity';
    
    // Check if already checked in
    const existing = await this.checkinModel.findOne({
      user: userId,
      activity: activityId,
      isCheckedIn: true
    }).lean();
    
    if (existing) {
      return {
        alreadyCheckedIn: true,
        userName: user.name,
        activityName,
        message: 'User is already checked in for this activity'
      };
    }
    
    // Generate a unique token for this QR code (for security, time-limited)
    const timestamp = Date.now();
    const tokenData = `${userId}:${activityId}:${timestamp}`;
    const token = createHash('sha256').update(tokenData).digest('hex');
    
    // Store token in cache with short TTL
    const qrData = {
      token,
      userId,
      activityId,
      timestamp,
      userName: user.name,
      activityName,
    };
    
    await this.cacheManager.set(`${this.QRCODE_CACHE_PREFIX}${token}`, qrData, this.QRCODE_TTL);
    
    return {
      qrCode: token,
      userId,
      activityId,
      userName: user.name,
      activityName,
      expiresIn: this.QRCODE_TTL
    };
  }
  
  /**
   * Verify a QR code and the check-in (for staff members)
   */
  async verifyCheckin(id: string, verifyDto: VerifyCheckinDto, staffId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid check-in ID format');
    }
    
    this.logger.log(`Verifying check-in ${id} with status: ${verifyDto.status} by staff ${staffId}`);
    
    const checkin = await this.checkinModel.findById(id);
    
    if (!checkin) {
      throw new NotFoundException(`Check-in with ID ${id} not found`);
    }
    
    // Update check-in status and staff info
    checkin.status = verifyDto.status;
    checkin.isCheckedIn = verifyDto.isCheckedIn;
    checkin.scannedBy = new Types.ObjectId(staffId);
    checkin.processedTime = new Date();
    
    if (verifyDto.notes) {
      checkin.notes = verifyDto.notes;
    }
    
    const updatedCheckin = await checkin.save();
    
    // Invalidate cache
    await this.invalidateCheckinCache(id);
    
    return updatedCheckin.toObject();
  }

  /**
   * Process a batch of offline check-ins from staff devices
   */
  async processBatchCheckins(batchDto: BatchCheckinDto, staffId: string) {
    this.logger.log(`Processing batch of ${batchDto.checkins.length} offline check-ins from staff ${staffId}`);
    
    const results = {
      total: batchDto.checkins.length,
      processed: 0,
      successful: 0,
      duplicates: 0,
      errors: 0,
      details: [] as any[]
    };
    
    // Process each check-in in the batch
    for (const checkinDto of batchDto.checkins) {
      try {
        results.processed++;
        
        // Check if already exists (by device and local ID)
        const existingByDeviceId = await this.checkinModel.findOne({
          deviceId: checkinDto.deviceId,
          localId: checkinDto.localId
        });
        
        if (existingByDeviceId) {
          results.duplicates++;
          results.details.push({
            localId: checkinDto.localId,
            status: 'duplicate',
            message: 'Check-in with this device ID and local ID already exists'
          });
          continue;
        }
        
        // Check if user is already checked in for this activity
        const existingCheckin = await this.checkinModel.findOne({
          user: checkinDto.user,
          activity: checkinDto.activity,
        });
        
        if (existingCheckin) {
          results.duplicates++;
          results.details.push({
            localId: checkinDto.localId,
            status: 'duplicate',
            message: 'User is already checked in for this activity'
          });
          continue;
        }
        
        // Create new check-in
        const newCheckin = new this.checkinModel({
          ...checkinDto,
          scannedBy: staffId,
          processedTime: new Date(),
          status: 'success',
          isCheckedIn: true
        });
        
        await newCheckin.save();
        results.successful++;
        results.details.push({
          localId: checkinDto.localId,
          status: 'success'
        });
      } catch (error) {
        results.errors++;
        results.details.push({
          localId: checkinDto.localId,
          status: 'error',
          message: error.message
        });
      }
    }
    
    // Invalidate cache after batch process
    await this.invalidateCheckinCache();
    
    return results;
  }

  /**
   * Find all checkins with pagination and filters
   */
  async findAll(
    filters: Record<string, any> = {},
    page = 1,
    limit = 10,
    populate: string[] = [],
    isCheckedIn?: boolean
  ) {
    if (isCheckedIn !== undefined) {
      filters.isCheckedIn = isCheckedIn;
    }
    
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
        .sort({ scanTime: -1 })
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
    populate: string[] = [],
    isCheckedIn?: boolean
  ) {
    if (!Types.ObjectId.isValid(activityId)) {
      throw new BadRequestException('Invalid activity ID format');
    }
    
    const filters: Record<string, any> = { activity: activityId };
    if (status) {
      filters.status = status;
    }
    if (isCheckedIn !== undefined) {
      filters.isCheckedIn = isCheckedIn;
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
    populate: string[] = [],
    isCheckedIn?: boolean
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    
    const filters: Record<string, any> = { user: userId };
    if (status) {
      filters.status = status;
    }
    if (isCheckedIn !== undefined) {
      filters.isCheckedIn = isCheckedIn;
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
      successCheckins,
      failedCheckins,
      duplicateCheckins,
      checkedInCount
    ] = await Promise.all([
      this.checkinModel.countDocuments(query),
      this.checkinModel.countDocuments({ ...query, status: 'pending' }),
      this.checkinModel.countDocuments({ ...query, status: 'success' }),
      this.checkinModel.countDocuments({ ...query, status: 'failed' }),
      this.checkinModel.countDocuments({ ...query, status: 'duplicate' }),
      this.checkinModel.countDocuments({ ...query, isCheckedIn: true }),
    ]);
    
    const stats = {
      total: totalCheckins,
      checkedIn: checkedInCount,
      pending: pendingCheckins,
      success: successCheckins,
      failed: failedCheckins,
      duplicate: duplicateCheckins,
      successRate: totalCheckins > 0 
        ? ((successCheckins / totalCheckins) * 100).toFixed(1) + '%'
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
    
    if (filters.isCheckedIn !== undefined) {
      query.isCheckedIn = filters.isCheckedIn;
    }
    
    if (filters.deviceId) {
      query.deviceId = filters.deviceId;
    }
    
    if (filters.isOfflineSync !== undefined) {
      query.isOfflineSync = filters.isOfflineSync;
    }
    
    // Date range filters for scan time
    if (filters.scanAfter) {
      query.scanTime = { $gte: new Date(filters.scanAfter) };
    }
    
    if (filters.scanBefore) {
      query.scanTime = { 
        ...query.scanTime || {},
        $lte: new Date(filters.scanBefore) 
      };
    }
    
    // Filter by scanned staff
    if (filters.scannedBy) {
      query.scannedBy = new Types.ObjectId(filters.scannedBy);
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
