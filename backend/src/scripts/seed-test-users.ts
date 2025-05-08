/**
 * สคริปต์สำหรับสร้างผู้ใช้จำนวนมากสำหรับทดสอบประสิทธิภาพ
 * 
 * การใช้งาน:
 * 1. cd backend
 * 2. pnpm exec ts-node src/scripts/seed-test-users.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as crypto from 'crypto';

// โหลด .env file
dotenv.config({ path: join(__dirname, '../../.env') });

const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/hllc_db',
  totalUsers: 3000,
  batchSize: 100, // จำนวน user ที่จะสร้างในแต่ละรอบ
  namePrefix: 'TestUser',
  password: 'password123',
  roleName: 'User', // ใช้ role ที่มีอยู่แล้ว
  logFilePath: join(__dirname, '../../user-seed-results.log')
};

// เพิ่ม interface สำหรับ user
interface TestUser {
  name: {
    first: string;
    middle?: string;
    last: string;
  };
  username: string;
  password: string;
  role: ObjectId;
  refreshToken: null;
  metadata: {
    email?: string;
    schoolId?: ObjectId;
    school?: any;
    majorId?: ObjectId;
    major?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface School {
  _id: ObjectId;
  name: {
    th: string;
    en: string;
  };
  majors?: Major[];
}

interface Major {
  _id: ObjectId;
  name: {
    th: string;
    en: string;
  };
  school: ObjectId;
}

// สร้าง metadata สำหรับผู้ใช้ตามโครงสร้างที่ถูกต้อง
function generateUserMetadata(schools: School[], majors: Record<string, Major[]>) {
  // Random school selection
  const randomSchool = schools.length > 0 ? schools[Math.floor(Math.random() * schools.length)] : null;
  let randomMajor: Major | undefined;
  
  // If this school has majors, randomly select one
  if (randomSchool) {
    const schoolMajors = majors[randomSchool._id.toString()];
    if (schoolMajors && schoolMajors.length > 0) {
      randomMajor = schoolMajors[Math.floor(Math.random() * schoolMajors.length)];
    }
  }
  
  return {
    phone: `${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}-${Math.floor(1000000 + Math.random() * 9000000)}`,
    address: `${Math.floor(Math.random() * 1000)} ${randomStreetName()}, ${randomCity()}`,
    email: `${crypto.randomBytes(8).toString('hex')}@example.com`,
    birthdate: randomBirthdate(),
    ...(randomSchool && {
      schoolId: randomSchool._id,
      school: {
        name: randomSchool.name,
        _id: randomSchool._id
      }
    }),
    ...(randomMajor && {
      majorId: randomMajor._id,
      major: {
        name: randomMajor.name,
        _id: randomMajor._id
      }
    })
  };
}

// Helper functions for generating random data
function randomStreetName() {
  const streets = [
    'Main Street', 'Park Avenue', 'Oak Street', 'Maple Road', 
    'Cedar Lane', 'Sunset Boulevard', 'Lake View', 'River Road',
    'Mountain Drive', 'Forest Way'
  ];
  return streets[Math.floor(Math.random() * streets.length)];
}

function randomCity() {
  const cities = [
    'Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 
    'Hua Hin', 'Ayutthaya', 'Khon Kaen', 'Udon Thani',
    'Hat Yai', 'Nakhon Ratchasima'
  ];
  return cities[Math.floor(Math.random() * cities.length)];
}

function randomBirthdate() {
  // Generate date between 1980 and 2002
  const start = new Date('1980-01-01').getTime();
  const end = new Date('2002-12-31').getTime();
  const randomTimestamp = start + Math.random() * (end - start);
  return new Date(randomTimestamp);
}

// สร้างชื่อสุ่ม
function generateRandomName(index: number) {
  const firstNames = ['John', 'Jane', 'Robert', 'Mary', 'William', 'Elizabeth', 'David', 'Jennifer', 'Michael', 'Linda'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return {
    first: `${firstName}_${index}`,
    middle: Math.random() > 0.7 ? 'M' : undefined,
    last: lastName
  };
}

async function seedTestUsers(): Promise<void> {
  console.log('🌱 เริ่มการสร้างผู้ใช้ทดสอบจำนวน', config.totalUsers, 'คน');
  console.log(`📡 กำลังเชื่อมต่อกับ MongoDB: ${config.mongoUri}`);

  const startTime = Date.now();
  let logOutput = '';

  const client = new MongoClient(config.mongoUri);
  
  try {
    await client.connect();
    console.log('✅ เชื่อมต่อกับ MongoDB สำเร็จ');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const rolesCollection = db.collection('roles');
    const schoolsCollection = db.collection('schools');
    const majorsCollection = db.collection('majors');
    
    // ดึง role ที่ต้องการ
    const role = await rolesCollection.findOne({ name: config.roleName });
    if (!role) {
      throw new Error(`❌ ไม่พบ role "${config.roleName}"`);
    }
    
    console.log(`✅ พบ role "${config.roleName}" ID: ${role._id}`);
    logOutput += `Role: ${config.roleName} (${role._id})\n`;
    
    // ดึงข้อมูล schools
    const schools = await schoolsCollection.find().toArray() as School[];
    if (schools.length === 0) {
      console.warn('⚠️ ไม่พบข้อมูลคณะ จะสร้างผู้ใช้โดยไม่มีข้อมูลคณะ');
    } else {
      console.log(`✅ พบคณะ ${schools.length} คณะ`);
      logOutput += `Faculties: ${schools.length}\n`;
    }
    
    // ดึงข้อมูล majors และจัดกลุ่มตาม school
    const majors = await majorsCollection.find().toArray() as Major[];
    const majorsBySchool: Record<string, Major[]> = {};
    
    majors.forEach(major => {
      const schoolId = major.school.toString();
      if (!majorsBySchool[schoolId]) {
        majorsBySchool[schoolId] = [];
      }
      majorsBySchool[schoolId].push(major);
    });
    
    console.log(`✅ พบสาขาวิชาทั้งหมด ${majors.length} สาขา`);
    logOutput += `Majors: ${majors.length}\n`;
    logOutput += `Total users to create: ${config.totalUsers}\n`;
    logOutput += `Batch size: ${config.batchSize}\n\n`;
    
    // เตรียม password hash ไว้ใช้ซ้ำ
    const hashedPassword = await bcrypt.hash(config.password, 10);
    
    const totalBatches = Math.ceil(config.totalUsers / config.batchSize);
    let totalCreated = 0;
    
    // วนลูปสร้างผู้ใช้เป็นชุด ๆ
    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStartTime = Date.now();
      const batchStartIdx = batch * config.batchSize;
      const batchEndIdx = Math.min(batchStartIdx + config.batchSize, config.totalUsers);
      const batchSize = batchEndIdx - batchStartIdx;
      
      console.log(`📦 กำลังสร้างชุดที่ ${batch + 1}/${totalBatches} (ผู้ใช้ ${batchStartIdx + 1}-${batchEndIdx})`);
      
      const users: TestUser[] = [];
      
      // สร้างข้อมูลผู้ใช้ในชุดนี้
      for (let i = batchStartIdx; i < batchEndIdx; i++) {
        const username = `${config.namePrefix}${i + 1}`;
        const name = generateRandomName(i + 1);
        
        users.push({
          name,
          username,
          password: hashedPassword,
          role: role._id,
          refreshToken: null,
          metadata: schools.length > 0 ? generateUserMetadata(schools, majorsBySchool) : {},
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // บันทึกลงฐานข้อมูล
      const insertResult = await usersCollection.insertMany(users);
      totalCreated += insertResult.insertedCount;
      
      const batchEndTime = Date.now();
      const batchDuration = batchEndTime - batchStartTime;
      const avgTimePerUser = batchDuration / batchSize;
      
      console.log(`✅ สร้างผู้ใช้ในชุดที่ ${batch + 1} จำนวน ${insertResult.insertedCount} คน สำเร็จใน ${batchDuration}ms (เฉลี่ย ${avgTimePerUser.toFixed(2)}ms/คน)`);
      
      logOutput += `Batch ${batch + 1}: Created ${insertResult.insertedCount} users in ${batchDuration}ms (avg: ${avgTimePerUser.toFixed(2)}ms/user)\n`;
    }
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const avgTimePerUser = totalDuration / totalCreated;
    
    console.log('');
    console.log('✅ สร้างผู้ใช้ทดสอบเสร็จสิ้น');
    console.log(`🆔 สร้างผู้ใช้ทั้งหมด ${totalCreated} คน`);
    console.log(`⏱️ ใช้เวลาทั้งหมด ${totalDuration}ms (เฉลี่ย ${avgTimePerUser.toFixed(2)}ms/คน)`);
    console.log('');
    console.log(`🔑 ทุกบัญชีใช้รหัสผ่าน: ${config.password}`);
    console.log(`📋 บันทึกผลการทำงานลงในไฟล์: ${config.logFilePath}`);
    
    // บันทึกข้อมูลสรุปเพิ่มเติม
    logOutput += `\nSummary:\n`;
    logOutput += `Total users created: ${totalCreated}\n`;
    logOutput += `Total time: ${totalDuration}ms\n`;
    logOutput += `Average time per user: ${avgTimePerUser.toFixed(2)}ms\n`;
    logOutput += `System info: ${os.type()} ${os.release()} | ${os.cpus()[0].model} x ${os.cpus().length} | ${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB RAM\n`;
    logOutput += `Timestamp: ${new Date().toISOString()}\n`;
    
    // บันทึกลงไฟล์
    fs.writeFileSync(config.logFilePath, logOutput);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างผู้ใช้ทดสอบ:', error);
  } finally {
    await client.close();
    console.log('📡 ปิดการเชื่อมต่อกับ MongoDB');
  }
}

// รันฟังก์ชันหลัก
seedTestUsers()
  .catch(console.error)
  .finally(() => {
    console.log('🏁 เสร็จสิ้นการทำงาน');
  }); 