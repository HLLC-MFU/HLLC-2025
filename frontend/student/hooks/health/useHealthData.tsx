// useHealthData.tsx
import { Platform } from 'react-native';

// ใช้ Platform.select เพื่อโหลด hook ที่เหมาะสมกับแพลตฟอร์ม
// วิธีนี้จะทำให้ Metro Bundler ไม่รวม (bundle) โค้ดของ HealthKit เข้าไปใน Android
// และไม่รวมโค้ดของ Health Connect เข้าไปใน iOS
const useHealthDataForPlatform = Platform.select({
  ios: () => require('./useHealthKitData').default, // โหลด useHealthKitData.tsx สำหรับ iOS
  android: () => require('./useHealthConnectData').default, // โหลด useHealthConnectData.tsx สำหรับ Android
  default: () => (date: Date) => {
    // Fallback สำหรับแพลตฟอร์มอื่นๆ หรือในกรณีที่ไม่มี Health API
    // console.log('Health data not available for this platform (neither iOS nor Android).');
    return { steps: 0, flights: 0, distance: 0 };
  },
})(); // ต้องมี () ปิดท้ายเพื่อเรียกใช้ฟังก์ชันที่ Platform.select คืนค่ามา

/**
 * Custom hook เพื่อดึงข้อมูลสุขภาพตามแพลตฟอร์มปัจจุบัน (iOS ใช้ HealthKit, Android ใช้ Health Connect)
 * @param {Date} date - วันที่ที่ต้องการดึงข้อมูลสุขภาพ
 * @returns {{steps: number, flights: number, distance: number}} - Object ที่ประกอบด้วยจำนวนก้าว, จำนวนชั้นที่ปีน, และระยะทางเดิน/วิ่ง
 */
const useHealthData = (date: Date) => {
  // เรียกใช้ hook ที่ถูกเลือกไว้สำหรับแพลตฟอร์มปัจจุบัน
  return useHealthDataForPlatform(date);
};

export default useHealthData;
