import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { userMetadataValidator } from '../../pkg/validator/userMetadata.validator';
import { throwIfExists, findOrThrow } from '../../pkg/validator/model.validator';
import * as bcrypt from 'bcryptjs';
import { buildPaginatedResponse, BaseResponse } from 'src/pkg/helper/buildPaginatedResponse';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MetadataEnrichmentService } from 'src/pkg/shared/enrichment/metadata-enrichment.service';
import { SharedMetadataService } from 'src/pkg/shared/metadata/metadata.service';
import { EnrichedUser } from 'src/pkg/shared/enrichment/use-response.interface';
import { BulkUploadUsersDto } from './dto/bulk-upload-users.dto';

/**
 * Users Service
 * 
 * Handles all user-related business logic, including:
 * - User CRUD operations
 * - User metadata management
 * - Authentication-related functions
 * - Bulk operations
 */
@Injectable()
export class UsersService {
  // Default constants
  private readonly DEFAULT_PASSWORD = '123456';
  private readonly USER_CACHE_TTL = 300; // 5 minutes

  // Logger for this service
  private readonly logger = new Logger(UsersService.name);

  /**
   * Constructor with dependency injection
   */
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly metadataService: SharedMetadataService,
    private readonly enrichmentService: MetadataEnrichmentService,
  ) {}

  /**
   * ==============================
   * CORE CRUD OPERATIONS
   * ==============================
   */

  /**
   * Create a new user
   * 
   * @param createUserDto - Data for the new user
   * @returns Newly created user with enriched metadata
   */
  async create(createUserDto: CreateUserDto): Promise<EnrichedUser> {
    // Check for duplicate username
    await throwIfExists(
      this.userModel, 
      { username: createUserDto.username }, 
      'Username already exists'
    );

    // Verify role exists
    const role = await findOrThrow(this.roleModel, createUserDto.role, 'Role');

    // Validate metadata against role's schema if defined
    if (role.metadataSchema) {
      userMetadataValidator(createUserDto.metadata || {}, role.metadataSchema);
    }

    // Enrich metadata with referenced entities
    const enrichedMetadata = await this.enrichMetadata(createUserDto.metadata || {});

    // Create and save the user
    const user = new this.userModel({
      ...createUserDto,
      role: new Types.ObjectId(createUserDto.role),
      metadata: enrichedMetadata,
    });

    const savedUser = await user.save();
    
    // Invalidate all user list caches
    await this.invalidateUserListCaches();
    
    return this.findOne(savedUser._id);
  }

  /**
   * Find all users with filtering and pagination
   * 
   * @param filters - MongoDB filter criteria
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @param excluded - Fields to exclude from response
   * @returns Paginated list of users with metadata
   */
  async findAll(
    filters: Record<string, any> = {},
    page = 1,
    limit = 100,
    excluded: string[] = [],
  ): Promise<BaseResponse<EnrichedUser[]>> {
    // Build cache key based on filters and pagination
    const cacheKey = `users:list:${JSON.stringify(filters)}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedData = await this.cacheManager.get<BaseResponse<EnrichedUser[]>>(cacheKey);
    if (cachedData) {
      this.logger.debug(`[Users] Cache HIT for key: ${cacheKey}`);
      return cachedData;
    }

    this.logger.debug(`[Users] Cache MISS for key: ${cacheKey}`);

    // Build query with pagination
    const query = this.userModel.find(filters);

    if (limit !== undefined && limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }

    // Execute query and get metadata in parallel
    const [data, total, latest] = await Promise.all([
      query.lean(),
      this.userModel.countDocuments(filters),
      this.userModel.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
    ]);

    // Enrich users with metadata using the enrichment service
    const enrichedData = await this.enrichmentService.enrichUsers(data);
    
    // Get last updated timestamp
    const lastUpdatedAt = latest && 'updatedAt' in latest && latest.updatedAt instanceof Date
      ? latest.updatedAt.toISOString()
      : new Date().toISOString();

    // Build response
    const result = buildPaginatedResponse(enrichedData, {
      total,
      page,
      limit: limit ?? total,
      lastUpdatedAt,
    });

    // Cache the response
    await this.cacheManager.set(cacheKey, result, this.USER_CACHE_TTL);

    return result;
  }

  /**
   * Find a user by ID or custom filter
   * 
   * @param idOrFilters - User ID or MongoDB filter criteria
   * @returns User with enriched metadata
   * @throws NotFoundException if user not found
   */
  async findOne(idOrFilters: string | FilterQuery<UserDocument>): Promise<EnrichedUser> {
    let user;
    
    // Find by ID or custom filter
    if (typeof idOrFilters === 'string') {
      user = await this.userModel.findById(idOrFilters).lean();
    } else {
      user = await this.userModel.findOne(idOrFilters).lean();
    }
    
    // Throw if not found
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Enrich user with metadata and return
    return this.enrichmentService.enrichUser(user);
  }

  /**
   * Update a user
   * 
   * @param id - User ID
   * @param updateUserDto - Fields to update
   * @returns Updated user with enriched metadata
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<EnrichedUser> {
    // Find user and verify role
    const user = await findOrThrow(this.userModel, id, 'User');
    const role = await findOrThrow(
      this.roleModel, 
      updateUserDto.role ?? user.role, 
      'Role'
    );

    // Validate metadata against role schema
    if (role.metadataSchema) {
      userMetadataValidator(updateUserDto.metadata || {}, role.metadataSchema);
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    // Update metadata if provided
    if (updateUserDto.metadata) {
      updateUserDto.metadata = await this.updateUserMetadata(user, updateUserDto);
    }

    // Apply updates and save
    Object.assign(user, updateUserDto);
    await user.save();
    
    // Invalidate all user list caches
    await this.invalidateUserListCaches();
    
    return this.findOne(id);
  }

  /**
   * Delete a user
   * 
   * @param id - User ID
   */
  async remove(id: string): Promise<void> {
    // Verify user exists
    await findOrThrow(this.userModel, id, 'User');
    
    // Delete user
    await this.userModel.findByIdAndDelete(id);
    
    // Invalidate all user list caches
    await this.invalidateUserListCaches();
  }

  /**
   * ==============================
   * ADVANCED USER OPERATIONS
   * ==============================
   */

  /**
   * Reset a user's password to default value
   * 
   * @param id - User ID
   * @returns User with updated password
   */
  async resetPassword(id: string): Promise<EnrichedUser> {
    this.logger.debug(`[Users] Resetting password for user ${id}`);
    const startTime = Date.now();
    
    // Find user
    const user = await findOrThrow(this.userModel, id, 'User');
    
    // Reset password and token
    user.password = await this.hashPassword(this.DEFAULT_PASSWORD);
    user.refreshToken = null;
    
    // Save changes
    await user.save();
    
    // Invalidate cache
    await this.metadataService.invalidate(['users']);
    
    // Log performance
    const duration = Date.now() - startTime;
    this.logger.log(`[Users] Password reset for user ${id} completed in ${duration}ms`);
    
    // Return enriched user
    return this.findOne(id);
  }

  /**
   * Upload multiple users in bulk
   * 
   * @param uploadData - Bulk upload data including users, default role and metadata
   * @returns Array of created users with enriched metadata
   */
  async uploadUsers(uploadData: BulkUploadUsersDto): Promise<EnrichedUser[]> {
    this.logger.log(`[Users] Uploading ${uploadData.users.length} users`);
    const startTime = Date.now();
    
    // Validate role
    const role = await findOrThrow(this.roleModel, uploadData.role, 'Role');
    
    // Check default major if provided
    if (uploadData.major) {
      const majorId = uploadData.major.toString();
      const majorData = await this.metadataService.getMajor(majorId);
      if (!majorData) {
        throw new NotFoundException(`Default major with ID ${majorId} not found`);
      }
    }
    
    // Process each user
    const createUserDtos = await Promise.all(
      uploadData.users.map(async (userData) => {
        // Get major data
        const userMajorId = userData.major || uploadData.major;
        if (userMajorId) {
          const majorData = await this.metadataService.getMajor(userMajorId.toString());
          if (!majorData) {
            throw new NotFoundException(`Major with ID ${userMajorId} not found for user ${userData.studentId}`);
          }
        }
        
        // Prepare metadata
        const metadata = { ...uploadData.metadata || {} };
        
        // Add major info to metadata
        if (userMajorId) {
          metadata.majorId = userMajorId;
          const majorData = await this.metadataService.getMajor(userMajorId.toString());
          if (majorData) {
            metadata.major = majorData;
          }
        }
        
        // Return user creation data
        return {
          name: {
            first: userData.name.first,
            last: userData.name.last || '',
          },
          username: userData.studentId,
          password: await this.hashPassword(this.DEFAULT_PASSWORD),
          role: role._id,
          metadata
        };
      })
    );
    
    try {
      // Bulk insert
      const insertedUsers = await this.userModel.insertMany(createUserDtos, { lean: true });
      
      // Invalidate cache
      await this.metadataService.invalidate(['users']);
      
      // Log performance
      const duration = Date.now() - startTime;
      this.logger.log(`[Users] Successfully uploaded ${insertedUsers.length} users in ${duration}ms`);
      
      // Return enriched users
      const result = await this.findAll(
        { _id: { $in: insertedUsers.map(u => u._id) } }, 
        1, 
        insertedUsers.length
      );
      return result.data as EnrichedUser[];
    } catch (error) {
      // Handle duplicate key errors
      if (error.code === 11000) {
        const duplicateKey = error.keyValue ? Object.keys(error.keyValue)[0] : 'unknown';
        const duplicateValue = error.keyValue ? error.keyValue[Object.keys(error.keyValue)[0]] : '';
        throw new BadRequestException(`Duplicate entry for ${duplicateKey}: ${duplicateValue}`);
      }
      throw error;
    }
  }
  
  /**
   * Delete multiple users by ID
   * 
   * @param ids - Array of user IDs to delete
   * @returns Object with count of deleted users
   */
  async removeMultiple(ids: string[]): Promise<{ deletedCount: number }> {
    this.logger.debug(`[Users] Removing multiple users: ${ids.join(', ')}`);
    const startTime = Date.now();
    
    // Validate input
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No user IDs provided for deletion');
    }
    
    // Validate each ID
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      throw new BadRequestException('One or more invalid user IDs provided');
    }
    
    // Perform deletion
    const result = await this.userModel.deleteMany({ 
      _id: { $in: validIds.map(id => new Types.ObjectId(id)) } 
    });
    
    // Check results
    if (result.deletedCount === 0) {
      throw new NotFoundException('No users found with the provided IDs');
    }
    
    // Invalidate cache
    await this.metadataService.invalidate(['users']);
    
    // Log performance
    const duration = Date.now() - startTime;
    this.logger.log(`[Users] Removed ${result.deletedCount} users in ${duration}ms`);
    
    return { deletedCount: result.deletedCount };
  }

  /**
   * Find a user by username
   * 
   * @param username - Username to search for
   * @returns User with enriched metadata
   */
  async findByUsername(username: string): Promise<EnrichedUser> {
    this.logger.debug(`[Users] Finding user by username: ${username}`);
    
    // Try to get from cache first
    const cacheKey = `user:username:${username}`;
    const cachedUser = await this.cacheManager.get<EnrichedUser>(cacheKey);
    
    if (cachedUser) {
      return cachedUser;
    }
    
    // Find in database
    const user = await this.userModel.findOne({ username }).lean();
    
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    
    // Check if user has completed registration
    if (!user.password || user.password.length === 0) {
      throw new BadRequestException(`User ${username} has not completed registration`);
    }
    
    // Enrich user data
    const enrichedUser = await this.enrichmentService.enrichUser(user);
    
    // Cache result
    await this.cacheManager.set(cacheKey, enrichedUser, this.USER_CACHE_TTL);
    
    return enrichedUser;
  }
  
  /**
   * Get registration statistics
   * 
   * @returns Object with registration statistics
   */
  async checkRegistrationStatus(): Promise<{
    totalUsers: number;
    registeredUsers: number;
    notRegisteredUsers: number;
    registrationRate: string;
  }> {
    this.logger.debug(`[Users] Checking registration status of all users`);
    
    // Try to get from cache
    const cacheKey = 'user:registration_status';
    const cachedStats = await this.cacheManager.get(cacheKey);
    
    if (cachedStats) {
      return cachedStats as {
        totalUsers: number;
        registeredUsers: number;
        notRegisteredUsers: number;
        registrationRate: string;
      };
    }
    
    // Get all users with minimal fields
    const users = await this.userModel.find(
      {},
      { password: 1, refreshToken: 1, username: 1 }
    ).lean();
    
    if (!users || users.length === 0) {
      throw new NotFoundException('No users found in the system');
    }
    
    // Calculate statistics
    const registeredUsers = users.filter(user => 
      user.password && 
      user.password.length > 0
    );
    
    const notRegisteredUsers = users.filter(user => 
      !user.password || 
      user.password.length === 0
    );
    
    const stats = {
      totalUsers: users.length,
      registeredUsers: registeredUsers.length,
      notRegisteredUsers: notRegisteredUsers.length,
      registrationRate: `${((registeredUsers.length / users.length) * 100).toFixed(2)}%`
    };
    
    // Cache results
    await this.cacheManager.set(cacheKey, stats, 900); // 15 minutes
    
    return stats;
  }

  /**
   * ==============================
   * HELPER METHODS
   * ==============================
   */
  
  /**
   * Hash a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
  
  /**
   * Enrich metadata with referenced entities
   */
  private async enrichMetadata(metadata: Record<string, any>): Promise<Record<string, any>> {
    const enriched = { ...metadata };
    
    // Add school data if schoolId exists
    if (enriched.schoolId) {
      enriched.school = await this.metadataService.getSchool(enriched.schoolId);
    }
    
    // Add major data if majorId exists
    if (enriched.majorId) {
      enriched.major = await this.metadataService.getMajor(enriched.majorId);
    }
    
    return enriched;
  }
  
  /**
   * Update user metadata, refreshing relationships as needed
   */
  private async updateUserMetadata(
    user: UserDocument, 
    updateUserDto: UpdateUserDto
  ): Promise<Record<string, any>> {
    const metadata = { ...user.metadata, ...updateUserDto.metadata };
    
    // Update school data if schoolId changed
    if (metadata.schoolId && (!user.metadata?.schoolId || 
        metadata.schoolId.toString() !== user.metadata.schoolId.toString())) {
      const school = await this.metadataService.getSchool(metadata.schoolId);
      if (school) {
        metadata.school = school;
      }
    }
    
    // Update major data if majorId changed
    if (metadata.majorId && (!user.metadata?.majorId || 
        metadata.majorId.toString() !== user.metadata.majorId.toString())) {
      const major = await this.metadataService.getMajor(metadata.majorId);
      if (major) {
        metadata.major = major;
      }
    }
    
    return metadata;
  }

  // Add new helper method for cache invalidation
  private async invalidateUserListCaches(): Promise<void> {
    const keys = await this.cacheManager.store.keys('users:list:*');
    if (keys.length > 0) {
        await Promise.all(keys.map(key => this.cacheManager.del(key)));
        this.logger.debug(`[Users] Invalidated ${keys.length} user list caches`);
    }
  }
}