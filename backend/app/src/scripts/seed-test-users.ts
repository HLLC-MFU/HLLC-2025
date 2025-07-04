/**
 * Script สำหรับสร้าง test users จำนวน 1,000 users สำหรับทดสอบ WebSocket
 *
 * การใช้งาน:
 * 1. cd backend
 * 2. pnpm exec ts-node src/scripts/seed-test-users.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

// โหลด .env file
dotenv.config({ path: join(__dirname, '../../.env') });

// Configuration
const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/hllc_db',
  totalUsers: 10000,
  batchSize: 50, // จำนวน users ต่อ batch
  userTemplate: {
    name: {
      first: "user",
      middle: "user.",
      last: "user"
    },
    role: new ObjectId("684d3e65a2368d21b0e1aa2a"),
    metadata: {
      major: new ObjectId("6847c1a45a319b7f4659490a")
    }
  }
};

interface CreatedUser {
  _id: ObjectId;
  username: string;
}

interface User {
  username: string;
  name: {
    first: string;
    middle: string;
    last: string;
  };
  role: ObjectId;
  metadata: {
    major: ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

async function seedTestUsers(): Promise<void> {
  console.log('🌱 เริ่มการ Seed Test Users');
  console.log(`📡 กำลังเชื่อมต่อกับ MongoDB: ${config.mongoUri}`);

  const client = new MongoClient(config.mongoUri);
  const createdUsers: CreatedUser[] = [];

  try {
    await client.connect();
    console.log('✅ เชื่อมต่อกับ MongoDB สำเร็จ');

    const db = client.db();
    const usersCollection = db.collection('users');

    // สร้าง users เป็น batch
    for (let i = 0; i < config.totalUsers; i += config.batchSize) {
      const batch: User[] = [];
      const batchEnd = Math.min(i + config.batchSize, config.totalUsers);
      
      console.log(`\n📦 กำลังสร้าง batch ${i / config.batchSize + 1} (users_ ${i + 1} - ${batchEnd})`);

      for (let j = i; j < batchEnd; j++) {
        const username = `users_${j + 1}`;
        
        // ตรวจสอบว่ามี user อยู่แล้วหรือไม่
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
          console.log(`⚠️ User ${username} มีอยู่แล้ว - ข้าม`);
          continue;
        }

        batch.push({
          ...config.userTemplate,
          username,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (batch.length > 0) {
        const result = await usersCollection.insertMany(batch);
        console.log(`✅ สร้าง ${batch.length} users สำเร็จ`);

        // เก็บข้อมูล users ที่สร้างสำเร็จ
        Object.entries(result.insertedIds).forEach(([_, id]) => {
          createdUsers.push({
            _id: id,
            username: `users_${createdUsers.length + 1}`
          });
        });
      }

      // หน่วงเวลาเล็กน้อยระหว่าง batch
      if (i + config.batchSize < config.totalUsers) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // บันทึกข้อมูล users ลงไฟล์สำหรับใช้ทดสอบ WebSocket
    const outputPath = join(__dirname, '../../../test-users.json');
    fs.writeFileSync(outputPath, JSON.stringify(createdUsers, null, 2));

    console.log('\n✅ สรุปผลการทำงาน:');
    console.log(`📊 สร้าง users ทั้งหมด: ${createdUsers.length} users`);
    console.log(`💾 บันทึกข้อมูล users ไปที่: ${outputPath}`);
    console.log('\n🔰 ข้อมูลนี้พร้อมสำหรับการทดสอบ WebSocket แล้ว');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้าง test users:', error);
  } finally {
    await client.close();
    console.log('📡 ปิดการเชื่อมต่อกับ MongoDB');
  }
}

// ทำงานทันที
seedTestUsers()
  .catch(console.error)
  .finally(() => {
    console.log('🏁 เสร็จสิ้นการทำงาน');
  }); 