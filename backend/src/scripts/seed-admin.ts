/**
 * Script สำหรับสร้าง admin account โดยตรงไปยัง database
 * 
 * การใช้งาน:
 * 1. cd backend
 * 2. npx ts-node src/scripts/seed-admin.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';

// โหลด .env file
dotenv.config({ path: join(__dirname, '../../.env') });

// กำหนด Actions ให้ตรงกับที่มีใน role.schema.ts
enum Actions {
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

// สร้าง permissions ที่ถูกต้องตามรูปแบบ `${string}:${Actions}`
const createPermissions = () => {
  const resources = ['users', 'schools', 'majors', 'roles', 'activities'];
  const actions = Object.values(Actions);
  
  const permissions: string[] = [];
  
  // เพิ่ม permissions แบบทั่วไป
  for (const resource of resources) {
    for (const action of actions) {
      permissions.push(`${resource}:${action}`);
    }
  }
  
  // เพิ่ม permissions แบบเฉพาะเจาะจง
  for (const resource of resources) {
    for (const action of actions) {
      permissions.push(`${resource}:${action}:id`);
    }
  }
  
  // เพิ่ม permissions พิเศษสำหรับ admin
  permissions.push('admin:access');
  
  return permissions;
};

// Configuration
const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/hllc_db',
  adminUser: {
    name: {
      first: 'System',
      last: 'Administrator'
    },
    username: 'admin',
    password: 'password123',
    roleName: 'Administrator',
    permissions: createPermissions()
  }
};

async function seedAdminUser(): Promise<void> {
  console.log('🌱 เริ่มการ Seed Admin Account');
  console.log(`📡 กำลังเชื่อมต่อกับ MongoDB: ${config.mongoUri}`);

  const client = new MongoClient(config.mongoUri);
  
  try {
    await client.connect();
    console.log('✅ เชื่อมต่อกับ MongoDB สำเร็จ');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const rolesCollection = db.collection('roles');
    
    // ตรวจสอบว่ามี admin user อยู่แล้วหรือไม่
    const existingUser = await usersCollection.findOne({ username: config.adminUser.username });
    if (existingUser) {
      console.log('⚠️ Admin user มีอยู่แล้ว');
      return;
    }
    
    // ค้นหาหรือสร้าง admin role
    let adminRole = await rolesCollection.findOne({ name: config.adminUser.roleName });
    
    if (!adminRole) {
      console.log('🔧 กำลังสร้าง admin role...');
      const roleResult = await rolesCollection.insertOne({
        name: config.adminUser.roleName,
        permissions: config.adminUser.permissions,
        metadataSchema: {
          required: [],
          properties: {}
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      adminRole = await rolesCollection.findOne({ _id: roleResult.insertedId });
      console.log(`✅ สร้าง Admin role สำเร็จ, ID: ${adminRole?._id.toString()}`);
      console.log(`✅ กำหนด Permissions จำนวน ${config.adminUser.permissions.length} สิทธิ์`);
    } else {
      console.log(`ℹ️ ค้นพบ Admin role, ID: ${adminRole._id.toString()}`);
      
      // อัพเดต permissions ถ้ามีการเปลี่ยนแปลง
      if (Array.isArray(adminRole.permissions) && 
          adminRole.permissions.length !== config.adminUser.permissions.length) {
        await rolesCollection.updateOne(
          { _id: adminRole._id },
          { $set: { permissions: config.adminUser.permissions } }
        );
        console.log(`✅ อัพเดต Permissions ใหม่จำนวน ${config.adminUser.permissions.length} สิทธิ์`);
      }
    }
    
    if (!adminRole) {
      throw new Error('❌ ไม่สามารถสร้างหรือค้นหา admin role ได้');
    }
    
    // สร้าง admin user
    const hashedPassword = await bcrypt.hash(config.adminUser.password, 10);
    
    const result = await usersCollection.insertOne({
      name: config.adminUser.name,
      username: config.adminUser.username,
      password: hashedPassword,
      role: adminRole._id,
      refreshToken: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('');
    console.log('✅ สร้าง Admin user สำเร็จ');
    console.log(`🆔 User ID: ${result.insertedId.toString()}`);
    console.log('👤 ข้อมูลสำหรับการเข้าสู่ระบบ:');
    console.log(`👤 Username: ${config.adminUser.username}`);
    console.log(`🔑 Password: ${config.adminUser.password}`);
    console.log('');
    console.log('🔰 สามารถใช้ข้อมูลนี้ในการเข้าสู่ระบบผ่าน API:');
    console.log('🔰 POST /api/auth/login');
    console.log(`🔰 Body: { "username": "${config.adminUser.username}", "password": "${config.adminUser.password}" }`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้าง admin user:', error);
  } finally {
    await client.close();
    console.log('📡 ปิดการเชื่อมต่อกับ MongoDB');
  }
}

// ทำงานทันที
seedAdminUser()
  .catch(console.error)
  .finally(() => {
    console.log('🏁 เสร็จสิ้นการทำงาน');
  }); 