import { Injectable } from '@nestjs/common';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major } from './entities/major.entity';
import { MajorDocument } from './schemas/major.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class MajorsService {
  private readonly METADATA_TTL = 3600; // 1 hour
  private readonly MAJORS_CACHE_KEY = 'metadata:all_majors';
  private readonly MAJORS_BY_SCHOOL_PREFIX = 'metadata:majors_by_school:';
  private readonly MAJORS_LAST_UPDATED_KEY = 'metadata:majors_last_updated';

  constructor(
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createMajorDto: CreateMajorDto) {
    const result = await this.majorModel.create(createMajorDto);
    
    // ล้าง cache เมื่อมีการเพิ่มข้อมูลใหม่
    await this.updateLastModified();
    await this.invalidateCache();
    
    return result.toObject();
  }

  async findAll() {
    try {
      // ตรวจสอบว่ามีการอัพเดตข้อมูลหรือไม่
      const lastCachedUpdate = await this.cacheManager.get<number>(this.MAJORS_LAST_UPDATED_KEY);
      const lastDbUpdate = await this.getLastUpdatedTimestamp();
      
      if (!lastCachedUpdate || lastDbUpdate > lastCachedUpdate) {
        await this.invalidateCache();
      }
      
      // ดึงข้อมูลจาก cache
      let majors = await this.cacheManager.get<any[]>(this.MAJORS_CACHE_KEY);
      
      // ถ้าไม่มี cache ให้ดึงจาก database และเก็บใน cache
      if (!majors) {
        majors = await this.fetchMajorsWithSchools();
        await this.cacheManager.set(this.MAJORS_CACHE_KEY, majors, this.METADATA_TTL);
        await this.updateLastModified();
      }
      
      return majors;
    } catch (error) {
      console.error('Error in findAll majors:', error);
      return this.majorModel.find().populate('school').lean();
    }
  }

  async findOne(id: string) {
    try {
      // ตรวจสอบใน cache ทั้งหมดก่อน
      const allMajors = await this.cacheManager.get<any[]>(this.MAJORS_CACHE_KEY);
      
      if (allMajors && Array.isArray(allMajors)) {
        const major = allMajors.find(m => m._id.toString() === id);
        if (major) return major;
      }
      
      // ถ้าไม่มีใน cache ให้ดึงจาก database
      const major = await this.majorModel.findById(id).populate('school').lean();
      return major;
    } catch (error) {
      console.error('Error in findOne major:', error);
      return this.majorModel.findById(id).populate('school').lean();
    }
  }

  async update(id: string, updateMajorDto: UpdateMajorDto) {
    const updatedMajor = await this.majorModel
      .findByIdAndUpdate(id, updateMajorDto, { new: true })
      .populate('school')
      .lean();
      
    // ล้าง cache เมื่อมีการอัพเดตข้อมูล
    await this.updateLastModified();
    await this.invalidateCache();
    
    return updatedMajor;
  }

  async remove(id: string) {
    const result = await this.majorModel.findByIdAndDelete(id).populate('school').lean();
    
    // ล้าง cache เมื่อมีการลบข้อมูล
    await this.updateLastModified();
    await this.invalidateCache();
    
    return result;
  }

  // --- Helper Methods ---
  
  private async fetchMajorsWithSchools() {
    return this.majorModel.find().populate('school').lean();
  }
  
  private async getLastUpdatedTimestamp(): Promise<number> {
    const latestMajor = await this.majorModel
      .findOne()
      .sort({ updatedAt: -1 })
      .select('updatedAt')
      .lean();
      
    return latestMajor && latestMajor['updatedAt']
      ? new Date(latestMajor['updatedAt']).getTime()
      : Date.now();
  }
  
  private async updateLastModified(): Promise<void> {
    await this.cacheManager.set(
      this.MAJORS_LAST_UPDATED_KEY,
      Date.now(),
      this.METADATA_TTL
    );
  }
  
  private async invalidateCache(): Promise<void> {
    // ล้าง cache หลัก
    await this.cacheManager.del(this.MAJORS_CACHE_KEY);
    
    // ล้าง cache ทั้งหมดที่ขึ้นต้นด้วย prefix
    const keys = await this.cacheManager.store.keys(`${this.MAJORS_BY_SCHOOL_PREFIX}*`);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
    }
  }
  
  // ใช้สำหรับดึงข้อมูลตามโรงเรียน (ใช้เพิ่มเติมหากต้องการ)
  async findBySchool(schoolId: string) {
    try {
      const cacheKey = `${this.MAJORS_BY_SCHOOL_PREFIX}${schoolId}`;
      let majors = await this.cacheManager.get<any[]>(cacheKey);
      
      if (!majors) {
        majors = await this.majorModel.find({ school: schoolId }).populate('school').lean();
        await this.cacheManager.set(cacheKey, majors, this.METADATA_TTL);
      }
      
      return majors;
    } catch (error) {
      console.error(`Error finding majors by school ${schoolId}:`, error);
      return this.majorModel.find({ school: schoolId }).populate('school').lean();
    }
  }
}
