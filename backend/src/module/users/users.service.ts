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
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly METADATA_TTL = 3600; // 1 hour
  private readonly ROLES_CACHE_KEY = 'metadata:roles';
  private readonly MAJORS_CACHE_KEY = 'metadata:majors';
  private readonly SCHOOLS_CACHE_KEY = 'metadata:schools';

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    await throwIfExists(this.userModel, { username: createUserDto.username }, 'Username already exists');

    const role = await findOrThrow(this.roleModel, createUserDto.role, 'Role');

    if (role.metadataSchema) {
      userMetadataValidator(createUserDto.metadata || {}, role.metadataSchema);
    }

    const enrichedMetadata = { ...createUserDto.metadata };
    
    if (enrichedMetadata?.schoolId) {
      const schoolData = await this.getSchoolData(enrichedMetadata.schoolId);
      if (schoolData) {
        enrichedMetadata.school = schoolData;
      }
    }
    
    if (enrichedMetadata?.majorId) {
      const majorData = await this.getMajorData(enrichedMetadata.majorId);
      if (majorData) {
        enrichedMetadata.major = majorData;
      }
    }

    const user = new this.userModel({
      ...createUserDto,
      role: new Types.ObjectId(createUserDto.role),
      metadata: enrichedMetadata
    });

    const savedUser = await user.save();
    // อัพเดต cache เมื่อมีการเพิ่มข้อมูลใหม่
    await this.invalidateUserRelatedCaches();
    
    return savedUser;
  }

  async findAll(
    filters: Record<string, any> = {},
    page = 1,
    limit?: number, // ❗ limit เป็น optional
    excluded: string[] = [],
  ) {
    // ใช้ metadata cache แทนการ populate
    const query = this.userModel.find(filters);

    if (limit !== undefined && limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }

    const [data, total, latest] = await Promise.all([
      query.lean(),
      this.userModel.countDocuments(filters),
      this.userModel.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean() as { updatedAt?: Date },
    ]);

    // ดึง metadata จาก cache
    const roleIds = data.map(user => user.role?.toString()).filter(Boolean);
    const roleData = await this.getRolesMetadata(roleIds);
    
    // ดึง school และ major จาก cache ถ้ายังไม่มีใน metadata
    const schoolIds = data
      .filter(user => user.metadata?.schoolId && !user.metadata?.school)
      .map(user => user.metadata!.schoolId!.toString());
      
    const majorIds = data
      .filter(user => user.metadata?.majorId && !user.metadata?.major)
      .map(user => user.metadata!.majorId!.toString());
    
    const schoolData = await this.getSchoolsMetadata(schoolIds);
    const majorData = await this.getMajorsMetadata(majorIds);

    // เพิ่ม metadata จาก cache แทนการ populate
    const enrichedData = await this.enrichUsersWithMetadata(
      data, 
      roleData,
      schoolData,
      majorData, 
      excluded
    );
    
    const lastUpdatedAt = latest?.updatedAt?.toISOString() ?? new Date().toISOString();

    return buildPaginatedResponse(enrichedData, {
      total,
      page,
      limit: limit ?? total,
      lastUpdatedAt,
    });
  }

  async findOne(idOrFilters: string | FilterQuery<UserDocument>): Promise<User> {
    let user;
    if (typeof idOrFilters === 'string') {
      user = await this.userModel.findById(idOrFilters).lean();
      if (!user) {
        throw new NotFoundException('User not found');
      }
    } else {
      user = await this.userModel.findOne(idOrFilters).lean();
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    // ดึง metadata จาก cache
    const roleData = await this.getRolesMetadata([user.role?.toString()]);
    
    const schoolIds = user.metadata?.schoolId ? [user.metadata.schoolId.toString()] : [];
    const majorIds = user.metadata?.majorId ? [user.metadata.majorId.toString()] : [];
    
    const schoolData = await this.getSchoolsMetadata(schoolIds);
    const majorData = await this.getMajorsMetadata(majorIds);
    
    // เพิ่ม metadata
    const [enrichedUser] = await this.enrichUsersWithMetadata(
      [user], 
      roleData,
      schoolData,
      majorData,
      []
    );
    
    return enrichedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await findOrThrow(this.userModel, id, 'User');
    const role = await findOrThrow(this.roleModel, updateUserDto.role ?? user.role, 'Role');

    if (role.metadataSchema) {
      userMetadataValidator(updateUserDto.metadata || {}, role.metadataSchema);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // ถ้ามีการอัพเดต metadata ให้ปรับปรุงข้อมูล school และ major
    if (updateUserDto.metadata) {
      const metadata = { ...user.metadata, ...updateUserDto.metadata };
      
      // ถ้ามีการอัพเดต schoolId
      if (metadata.schoolId && (!user.metadata?.schoolId || 
          metadata.schoolId.toString() !== user.metadata.schoolId.toString())) {
        const schoolData = await this.getSchoolData(metadata.schoolId);
        if (schoolData) {
          metadata.school = schoolData;
        }
      }
      
      // ถ้ามีการอัพเดต majorId
      if (metadata.majorId && (!user.metadata?.majorId || 
          metadata.majorId.toString() !== user.metadata.majorId.toString())) {
        const majorData = await this.getMajorData(metadata.majorId);
        if (majorData) {
          metadata.major = majorData;
        }
      }
      
      updateUserDto.metadata = metadata;
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await user.save();
    
    // อัพเดต cache เมื่อมีการแก้ไขข้อมูล
    await this.invalidateUserRelatedCaches();
    
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await findOrThrow(this.userModel, id, 'User');
    await this.userModel.findByIdAndDelete(id);
    
    // อัพเดต cache เมื่อมีการลบข้อมูล
    await this.invalidateUserRelatedCaches();
  }

  // --- Metadata Caching Methods ---
  
  private async getRolesMetadata(roleIds: string[]): Promise<Record<string, any>> {
    try {
      this.logger.debug(`[Cache] Fetching roles metadata for: ${roleIds.join(', ')}`);
      const startTime = Date.now();
      let rolesData = await this.cacheManager.get<Record<string, any>>(this.ROLES_CACHE_KEY);
      const fetchTime = Date.now() - startTime;
      
      if (!rolesData) {
        this.logger.debug(`[Cache] MISS for roles - Fetching from database...`);
        const dbStartTime = Date.now();
        // ถ้าไม่มี cache ให้ดึงข้อมูลทั้งหมดและเก็บไว้
        const roles = await this.roleModel.find().lean();
        const dbFetchTime = Date.now() - dbStartTime;
        this.logger.debug(`[Cache] Database fetch took ${dbFetchTime}ms for roles (${roles.length} entries)`);
        
        rolesData = {};
        
        for (const role of roles) {
          rolesData[role._id.toString()] = role;
        }
        
        // เก็บลง cache
        const cacheStartTime = Date.now();
        await this.cacheManager.set(this.ROLES_CACHE_KEY, rolesData, this.METADATA_TTL);
        const cacheSetTime = Date.now() - cacheStartTime;
        this.logger.debug(`[Cache] Stored roles in cache in ${cacheSetTime}ms`);
      } else {
        this.logger.debug(`[Cache] HIT for roles - Retrieved in ${fetchTime}ms`);
      }
      
      // กรองเฉพาะ role ที่ต้องการ
      const filteredRoles: Record<string, any> = {};
      for (const roleId of roleIds) {
        if (roleId && rolesData[roleId]) {
          filteredRoles[roleId] = rolesData[roleId];
        }
      }
      
      return filteredRoles;
    } catch (error) {
      this.logger.error(`[Cache] Error getting roles metadata: ${error.message}`, error.stack);
      // ถ้าเกิด error ให้ดึงข้อมูลจาก database โดยตรง
      const roles = await this.roleModel.find({ _id: { $in: roleIds } }).lean();
      const rolesMap: Record<string, any> = {};
      for (const role of roles) {
        rolesMap[role._id.toString()] = role;
      }
      return rolesMap;
    }
  }
  
  private async getSchoolsMetadata(schoolIds: string[]): Promise<Record<string, any>> {
    if (!schoolIds.length) return {};
    
    try {
      // ตรวจสอบ cache
      let schoolsData = await this.cacheManager.get<Record<string, any>>(this.SCHOOLS_CACHE_KEY);
      
      if (!schoolsData) {
        // ดึงข้อมูลจาก database
        schoolsData = await this.fetchAndCacheSchoolsData();
      }
      
      // กรองเฉพาะ school ที่ต้องการ
      const filteredSchools: Record<string, any> = {};
      for (const schoolId of schoolIds) {
        if (schoolId && schoolsData[schoolId]) {
          filteredSchools[schoolId] = schoolsData[schoolId];
        }
      }
      
      return filteredSchools;
    } catch (error) {
      console.error('Error getting schools metadata:', error);
      return {};
    }
  }
  
  private async getMajorsMetadata(majorIds: string[]): Promise<Record<string, any>> {
    if (!majorIds.length) return {};
    
    try {
      // ตรวจสอบ cache
      let majorsData = await this.cacheManager.get<Record<string, any>>(this.MAJORS_CACHE_KEY);
      
      if (!majorsData) {
        // ดึงข้อมูลจาก database
        majorsData = await this.fetchAndCacheMajorsData();
      }
      
      // กรองเฉพาะ major ที่ต้องการ
      const filteredMajors: Record<string, any> = {};
      for (const majorId of majorIds) {
        if (majorId && majorsData[majorId]) {
          filteredMajors[majorId] = majorsData[majorId];
        }
      }
      
      return filteredMajors;
    } catch (error) {
      console.error('Error getting majors metadata:', error);
      return {};
    }
  }
  
  private async fetchAndCacheSchoolsData(): Promise<Record<string, any>> {
    try {
      // Check if School model exists
      const SchoolModel = this.userModel.db.models.School;
      if (!SchoolModel) {
        console.error('School model not found in mongoose connection');
        return {};
      }
      
      // Use the School model to query data
      const schools = await SchoolModel.find().lean();
      
      const schoolsMap: Record<string, any> = {};
      for (const school of schools) {
        if (school && school._id) {
        schoolsMap[school._id.toString()] = school;
        }
      }
      
      // เก็บลง cache
      await this.cacheManager.set(this.SCHOOLS_CACHE_KEY, schoolsMap, this.METADATA_TTL);
      
      return schoolsMap;
    } catch (error) {
      console.error('Error fetching schools data:', error);
      return {};
    }
  }
  
  private async fetchAndCacheMajorsData(): Promise<Record<string, any>> {
    try {
      // Check if Major model exists
      const MajorModel = this.userModel.db.models.Major;
      if (!MajorModel) {
        console.error('Major model not found in mongoose connection');
        return {};
      }
      
      // Use the Major model to query data
      const majors = await MajorModel.find().lean();
      
      const majorsMap: Record<string, any> = {};
      for (const major of majors) {
        if (major && major._id) {
        majorsMap[major._id.toString()] = major;
        }
      }
      
      // เก็บลง cache
      await this.cacheManager.set(this.MAJORS_CACHE_KEY, majorsMap, this.METADATA_TTL);
      
      return majorsMap;
    } catch (error) {
      console.error('Error fetching majors data:', error);
      return {};
    }
  }
  
  private async getSchoolData(schoolId: string | Types.ObjectId): Promise<any> {
    const schools = await this.getSchoolsMetadata([schoolId.toString()]);
    return schools[schoolId.toString()];
  }
  
  private async getMajorData(majorId: string | Types.ObjectId): Promise<any> {
    const majors = await this.getMajorsMetadata([majorId.toString()]);
    return majors[majorId.toString()];
  }
  
  private async enrichUsersWithMetadata(
    users: any[], 
    rolesData: Record<string, any>,
    schoolsData: Record<string, any>,
    majorsData: Record<string, any>,
    excluded: string[] = []
  ): Promise<any[]> {
    return users.map(user => {
      const enrichedUser = { ...user };
      
      // เพิ่ม role data
      if (user.role && rolesData[user.role.toString()] && !excluded.includes('role')) {
        enrichedUser.role = rolesData[user.role.toString()];
      }
      
      // เพิ่ม school data (ถ้ายังไม่มี)
      if (user.metadata?.schoolId && !user.metadata.school && schoolsData[user.metadata.schoolId.toString()]) {
        enrichedUser.metadata = {
          ...enrichedUser.metadata,
          school: schoolsData[user.metadata.schoolId.toString()]
        };
      }
      
      // เพิ่ม major data (ถ้ายังไม่มี)
      if (user.metadata?.majorId && !user.metadata.major && majorsData[user.metadata.majorId.toString()]) {
        enrichedUser.metadata = {
          ...enrichedUser.metadata,
          major: majorsData[user.metadata.majorId.toString()]
        };
      }
      
      return enrichedUser;
    });
  }
  
  private async invalidateUserRelatedCaches(): Promise<void> {
    this.logger.log('[Cache] Invalidating user-related caches');
    const startTime = Date.now();
    
    // Clear all related caches to ensure fresh data
    await this.cacheManager.del(this.ROLES_CACHE_KEY);
    await this.cacheManager.del(this.SCHOOLS_CACHE_KEY);
    await this.cacheManager.del(this.MAJORS_CACHE_KEY);
    
    // Try to get all cache keys with these prefixes and delete them
    try {
      const store = this.cacheManager.store as any;
      if (store && typeof store.keys === 'function') {
        const patterns = [
          'metadata:*',
          'users:*'
        ];
        
        for (const pattern of patterns) {
          try {
            const keysStartTime = Date.now();
            const keys = await store.keys(pattern);
            const keysFetchTime = Date.now() - keysStartTime;
            
            this.logger.debug(`[Cache] Found ${keys.length} keys for pattern ${pattern} in ${keysFetchTime}ms`);
            
            if (keys && keys.length) {
              const deleteStartTime = Date.now();
              await Promise.all(keys.map(key => this.cacheManager.del(key)));
              const deleteTime = Date.now() - deleteStartTime;
              
              this.logger.debug(`[Cache] Deleted ${keys.length} keys in ${deleteTime}ms`);
            }
          } catch (e) {
            this.logger.error(`[Cache] Error clearing cache pattern ${pattern}: ${e.message}`, e.stack);
          }
        }
      }
    } catch (error) {
      this.logger.error(`[Cache] Error clearing cache: ${error.message}`, error.stack);
    }
    
    const totalTime = Date.now() - startTime;
    this.logger.log(`[Cache] Cache invalidation completed in ${totalTime}ms`);
  }

  /**
   * Reset a user's password to a default value
   * This clears the current password and secret
   */
  async resetPassword(id: string): Promise<User> {
    this.logger.debug(`[Users] Resetting password for user ${id}`);
    const startTime = Date.now();
    
    const user = await findOrThrow(this.userModel, id, 'User');
    
    // Clear password and secret
    user.password = await bcrypt.hash('123456', 10);
    user.refreshToken = null;
    
    const updatedUser = await user.save();
    
    // Invalidate any cached data for this user
    await this.invalidateUserRelatedCaches();
    
    const duration = Date.now() - startTime;
    this.logger.log(`[Users] Password reset for user ${id} completed in ${duration}ms`);
    
    return this.findOne(id); // Use findOne to get the enriched user with metadata
  }

  /**
   * Upload multiple users in bulk with specified defaults
   */
  async uploadUsers(uploadData: {
    users: Array<{
      name: { first: string; last: string };
      studentId: string;
      major?: string | Types.ObjectId;
    }>;
    major?: string | Types.ObjectId;
    role: string | Types.ObjectId;
    metadata?: Record<string, any>;
  }): Promise<any> {
    this.logger.log(`[Users] Uploading ${uploadData.users.length} users`);
    const startTime = Date.now();
    
    // Validate the role
    const role = await findOrThrow(this.roleModel, uploadData.role, 'Role');
    
    // Check if major exists if provided as default
    if (uploadData.major) {
      const majorId = uploadData.major.toString();
      const majorData = await this.getMajorData(majorId);
      if (!majorData) {
        throw new NotFoundException(`Default major with ID ${majorId} not found`);
      }
    }
    
    // Process each user, checking their major if specified
    const createUserDtos = await Promise.all(
      uploadData.users.map(async (userData) => {
        const userMajorId = userData.major || uploadData.major;
        
        if (userMajorId) {
          const majorData = await this.getMajorData(userMajorId.toString());
          if (!majorData) {
            throw new NotFoundException(`Major with ID ${userMajorId} not found for user ${userData.studentId}`);
          }
        }
        
        // Prepare base metadata
        const metadata = { ...uploadData.metadata || {} };
        
        // Add major data to metadata if provided
        if (userMajorId) {
          metadata.majorId = userMajorId;
          const majorData = await this.getMajorData(userMajorId.toString());
          if (majorData) {
            metadata.major = majorData;
          }
        }
        
        return {
          name: {
            first: userData.name.first,
            last: userData.name.last
          },
          username: userData.studentId,
          password: await bcrypt.hash('123456', 10), // Default password
          role: role._id,
          metadata
        };
      })
    );
    
    try {
      // Bulk insert users
      const insertedUsers = await this.userModel.insertMany(createUserDtos, { lean: true });
      
      // Invalidate cache after bulk creation
      await this.invalidateUserRelatedCaches();
      
      const duration = Date.now() - startTime;
      this.logger.log(`[Users] Successfully uploaded ${insertedUsers.length} users in ${duration}ms`);
      
      // Return with full metadata enrichment
      const result = await this.findAll({ _id: { $in: insertedUsers.map(u => u._id) } }, 1, insertedUsers.length);
      return result.data;
    } catch (error) {
      if (error.code === 11000) {
        const duplicateKey = error.keyValue ? Object.keys(error.keyValue)[0] : 'unknown';
        const duplicateValue = error.keyValue ? error.keyValue[Object.keys(error.keyValue)[0]] : '';
        throw new BadRequestException(`Duplicate entry for ${duplicateKey}: ${duplicateValue}`);
      }
      throw error;
    }
  }

  /**
   * Check status of all user registrations
   */
  async checkRegistrationStatus(): Promise<{
    totalUsers: number;
    registeredUsers: number;
    notRegisteredUsers: number;
    registrationRate: string;
  }> {
    this.logger.debug(`[Users] Checking registration status of all users`);
    
    // Use a cached pattern for this operation with short TTL
    const cacheKey = 'user:registration_status';
    const cachedStats = await this.cacheManager.get(cacheKey);
    
    if (cachedStats) {
      return cachedStats as any;
    }
    
    const users = await this.userModel.find(
      {},
      { password: 1, refreshToken: 1, username: 1 }
    ).lean();
    
    if (!users || users.length === 0) {
      throw new NotFoundException('No users found in the system');
    }
    
    // Consider a user registered if they have password and have logged in at least once
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
    
    // Cache the results for 15 minutes
    await this.cacheManager.set(cacheKey, stats, 900);
    
    return stats;
  }
  
  /**
   * Delete multiple users by IDs
   */
  async removeMultiple(ids: string[]): Promise<{ deletedCount: number }> {
    this.logger.debug(`[Users] Removing multiple users: ${ids.join(', ')}`);
    const startTime = Date.now();
    
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No user IDs provided for deletion');
    }
    
    // Validate IDs first
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      throw new BadRequestException('One or more invalid user IDs provided');
    }
    
    const result = await this.userModel.deleteMany({ 
      _id: { $in: validIds.map(id => new Types.ObjectId(id)) } 
    });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('No users found with the provided IDs');
    }
    
    // Invalidate cache after bulk deletion
    await this.invalidateUserRelatedCaches();
    
    const duration = Date.now() - startTime;
    this.logger.log(`[Users] Removed ${result.deletedCount} users in ${duration}ms`);
    
    return { deletedCount: result.deletedCount };
  }
  
  /**
   * Find a user by their student ID (username)
   */
  async findByUsername(username: string): Promise<User> {
    this.logger.debug(`[Users] Finding user by username: ${username}`);
    
    // Try to find in cache first
    const cacheKey = `user:username:${username}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    
    if (cachedUser) {
      return cachedUser;
    }
    
    // Find in database
    const user = await this.userModel.findOne({ username }).lean();
    
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    
    // Check if the user has registered (has password)
    if (!user.password || user.password.length === 0) {
      throw new BadRequestException(`User ${username} has not completed registration`);
    }
    
    // Enrich with metadata and store in cache (short TTL for user data)
    const roleData = await this.getRolesMetadata([user.role?.toString()]);
    
    const schoolIds = user.metadata?.schoolId ? [user.metadata.schoolId.toString()] : [];
    const majorIds = user.metadata?.majorId ? [user.metadata.majorId.toString()] : [];
    
    const schoolData = await this.getSchoolsMetadata(schoolIds);
    const majorData = await this.getMajorsMetadata(majorIds);
    
    const [enrichedUser] = await this.enrichUsersWithMetadata(
      [user], 
      roleData,
      schoolData,
      majorData,
      []
    );
    
    // Cache for a short time (5 minutes)
    await this.cacheManager.set(cacheKey, enrichedUser, 300);
    
    return enrichedUser;
  }
}