import { Inject } from "@nestjs/common";

import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Injectable, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";
import { Model, Types, Connection } from "mongoose";
import { buildCacheKey, buildTimestampKey } from "./metadata.utils";
import { MetadataKey } from "./metadata.types";
import { InjectConnection } from "@nestjs/mongoose";

@Injectable()
export class SharedMetadataService {
    private readonly logger = new Logger(SharedMetadataService.name);
    // Cache TTL
    private readonly TTL = 3600; // 1 Hour

    // Constructor Injection
    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        @InjectConnection() private readonly connection: Connection,
    ) {}

    // Get Metadata Map
    async getMetadataMap<T>(
        // Declare Cache Key, Database Fetcher, Last Updated Key, Database Last Updated
        cacheKey: string,
        dbFetcher: () => Promise<T[]>,
        lastUpdatedKey: string,
        dbLastUpdated: () => Promise<number>

        // Declare Cache TTL
    ): Promise<Record<string, T>> {
        // Get Last Cached
        const lastCached = await this.cacheManager.get<number>(lastUpdatedKey);
        // Get Last Database Updated
        const lastDbUpdated = await dbLastUpdated();

        // Check if Cache is Outdated
        if (!lastCached || lastCached < lastDbUpdated) {

            // Then Invalidate Cache (Delete Cache)
            await this.invalidateCache(cacheKey)
        }

        // Get Cached Metadata Map
        let cached = await this.cacheManager.get<Record<string, T>>(cacheKey)
        // If Cached Metadata Map Exists, Return Cached Metadata Map
        if (cached) return cached;

        // Get Metadata List from Database
        const list = await dbFetcher();
        // Create Metadata Map from Metadata List
        const map = Object.fromEntries(
            list.map((item: any) => [item._id.toString(), item])
          );

        // Set Cached Metadata Map
        await this.cacheManager.set(cacheKey, map, this.TTL)
        // Set Last Updated Key
        await this.cacheManager.set(lastUpdatedKey, lastDbUpdated, this.TTL)

        // Return Metadata Map
        return map;
    }

    // Invalidate Cache
    async invalidateCache(key: string) {
        // if Cache Exists, Delete Cache
        if (await this.cacheManager.get(key)) {
            // Delete Cache
            await this.cacheManager.del(key);
        }
    }

    // Get Last Updated Time Stamp from Database
    async getLastUpdatedTimeStampFromDatabase<T>(model : any): Promise<number> {
        // Get Latest Document
        const latest = await model.findOne().sort(
            { updatedAt: -1 }
        ).select('updatedAt').lean();
        // Return Last Updated Time Stamp
        return latest?.updatedAt ? new Date(latest.updatedAt).getTime() : Date.now();
    }
    
    // Get role data by ID
    async getRole(id: string | Types.ObjectId): Promise<any> {
        try {
            const RoleModel = this.connection.model('Role');
            if (!RoleModel) {
                this.logger.error('Role model not found');
                return null;
            }

            const cacheKey = buildCacheKey('roles');
            const timestampKey = buildTimestampKey('roles');
            
            const rolesMap = await this.getMetadataMap(
                cacheKey,
                () => RoleModel.find().lean(),
                timestampKey,
                () => this.getLastUpdatedTimeStampFromDatabase(RoleModel)
            );
            
            return rolesMap[id.toString()];
        } catch (error) {
            this.logger.error(`Error getting role: ${error.message}`, error.stack);
            return null;
        }
    }
    
    // Get school data by ID
    async getSchool(id: string | Types.ObjectId): Promise<any> {
        try {
            const SchoolModel = this.connection.model('School');
            if (!SchoolModel) {
                this.logger.error('School model not found');
                return null;
            }

            const cacheKey = buildCacheKey('schools');
            const timestampKey = buildTimestampKey('schools');
            
            const schoolsMap = await this.getMetadataMap(
                cacheKey,
                () => SchoolModel.find().lean(),
                timestampKey,
                () => this.getLastUpdatedTimeStampFromDatabase(SchoolModel)
            );
            
            return schoolsMap[id.toString()];
        } catch (error) {
            this.logger.error(`Error getting school: ${error.message}`, error.stack);
            return null;
        }
    }
    
    // Get major data by ID
    async getMajor(id: string | Types.ObjectId): Promise<any> {
        try {
            const MajorModel = this.connection.model('Major');
            if (!MajorModel) {
                this.logger.error('Major model not found');
                return null;
            }

            const cacheKey = buildCacheKey('majors');
            const timestampKey = buildTimestampKey('majors');
            
            const majorsMap = await this.getMetadataMap(
                cacheKey,
                () => MajorModel.find().lean(),
                timestampKey,
                () => this.getLastUpdatedTimeStampFromDatabase(MajorModel)
            );
            
            return majorsMap[id.toString()];
        } catch (error) {
            this.logger.error(`Error getting major: ${error.message}`, error.stack);
            return null;
        }
    }
    
    // Invalidate multiple caches by keys
    async invalidate(keys: MetadataKey[]): Promise<void> {
        try {
            for (const key of keys) {
                const cacheKey = buildCacheKey(key);
                await this.invalidateCache(cacheKey);
                this.logger.log(`Cache invalidated for key: ${key}`);
            }
        } catch (error) {
            this.logger.error(`Error invalidating caches: ${error.message}`, error.stack);
        }
    }
}