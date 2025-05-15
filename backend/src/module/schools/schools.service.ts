import { Injectable } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School } from './entities/school.entity';
import { SchoolDocument } from './schemas/school.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class SchoolsService {
  private readonly METADATA_TTL = 3600; // 1 hour
  private readonly SCHOOLS_CACHE_KEY = 'metadata:all_schools';
  private readonly SCHOOLS_LAST_UPDATED_KEY = 'metadata:schools_last_updated';

  constructor(
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createSchoolDto: CreateSchoolDto) {
    const result = await this.schoolModel.create(createSchoolDto);
    await this.updateLastModified();
    await this.invalidateAllSchoolsCache();
    return result.toObject();
  }

  async findAll() {
    try {
      // ตรวจสอบว่ามีการอัพเดตข้อมูลหรือไม่ตั้งแต่ครั้งสุดท้ายที่ดึง cache
      const lastCachedUpdate = await this.cacheManager.get<number>(this.SCHOOLS_LAST_UPDATED_KEY);
      const lastDbUpdate = await this.getLastUpdatedTimestamp();
      
      // ถ้า cache ไม่ up to date ให้ล้าง cache
      if (!lastCachedUpdate || lastDbUpdate > lastCachedUpdate) {
        await this.invalidateAllSchoolsCache();
      }
      
      // ดึงข้อมูลจาก cache
      let schools = await this.cacheManager.get<any[]>(this.SCHOOLS_CACHE_KEY);
      
      // ถ้าไม่มี cache ให้ดึงจาก database
      if (!schools) {
        schools = await this.schoolModel.find().lean();
        
        // เก็บข้อมูลใน cache
        await this.cacheManager.set(this.SCHOOLS_CACHE_KEY, schools, this.METADATA_TTL);
        await this.updateLastModified();
      }
      
      return schools;
    } catch (error) {
      console.error('Error in findAll schools:', error);
      return this.schoolModel.find().lean();
    }
  }

  async findOne(id: string) {
    try {
      // ตรวจสอบใน cache ทั้งหมดก่อน
      const allSchools = await this.cacheManager.get<any[]>(this.SCHOOLS_CACHE_KEY);
      
      if (allSchools && Array.isArray(allSchools)) {
        const school = allSchools.find(s => s._id.toString() === id);
        if (school) return school;
      }
      
      // ถ้าไม่มีใน cache ให้ดึงจาก database
      const school = await this.schoolModel.findById(id).lean();
      return school;
    } catch (error) {
      console.error('Error in findOne school:', error);
      return this.schoolModel.findById(id).lean();
    }
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto) {
    const updatedSchool = await this.schoolModel.findByIdAndUpdate(
      id, 
      updateSchoolDto, 
      { new: true }
    ).lean();
    
    // อัพเดต timestamp และล้าง cache
    await this.updateLastModified();
    await this.invalidateAllSchoolsCache();
    
    return updatedSchool;
  }

  async remove(id: string) {
    const result = await this.schoolModel.findByIdAndDelete(id).lean();
    
    // อัพเดต timestamp และล้าง cache
    await this.updateLastModified();
    await this.invalidateAllSchoolsCache();
    
    return result;
  }

  // --- Metadata Caching Helper Methods ---
  
  private async getLastUpdatedTimestamp(): Promise<number> {
    const latestSchool = await this.schoolModel.findOne()
      .sort({ updatedAt: -1 })
      .select('updatedAt')
      .lean();
      
    return latestSchool && latestSchool['updatedAt'] 
      ? new Date(latestSchool['updatedAt']).getTime()
      : Date.now();
  }
  
  private async updateLastModified(): Promise<void> {
    await this.cacheManager.set(
      this.SCHOOLS_LAST_UPDATED_KEY, 
      Date.now(), 
      this.METADATA_TTL
    );
  }
  
  private async invalidateAllSchoolsCache(): Promise<void> {
    await this.cacheManager.del(this.SCHOOLS_CACHE_KEY);
  }
}
