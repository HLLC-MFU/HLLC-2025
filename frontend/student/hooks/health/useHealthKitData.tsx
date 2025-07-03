// useHealthKitData.tsx
import { useEffect, useState } from 'react';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';

// กำหนด permissions สำหรับ HealthKit
const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
    ],
    write: [], // ในที่นี้ไม่มีการเขียนข้อมูล
  },
};

/**
 * Custom hook for fetching health data from Apple HealthKit on iOS.
 * @param {Date} date - The date for which to fetch health data.
 * @returns {{steps: number, flights: number, distance: number}} - An object containing steps, flights climbed, and distance walked/run.
 */
const useHealthKitData = (date: Date) => {
  // State สำหรับเก็บสถานะการอนุญาตและข้อมูลสุขภาพ
  const [hasPermissions, setHasPermission] = useState<boolean>(false);
  const [steps, setSteps] = useState<number>(0);
  const [flights, setFlights] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  // ฟังก์ชันสำหรับดึงข้อมูลจาก HealthKit
  const fetchHealthKitData = () => {
    if (!hasPermissions) {
      console.log('Waiting for HealthKit permissions before fetching data.');
      return;
    }

    console.log('Fetching iOS HealthKit data for date:', date.toISOString());
    const options: HealthInputOptions = {
      date: date.toISOString(),
      includeManuallyAdded: false,
    };

    // ดึงจำนวนก้าว
    AppleHealthKit.getStepCount(options, (err: string | null, results: { value: number }) => {
      if (err) {
        console.error('Error getting steps from HealthKit:', err);
        return;
      }
      setSteps(results.value);
      console.log('Steps (iOS):', results.value);
    });

    // ดึงจำนวนชั้นที่ปีน
    AppleHealthKit.getFlightsClimbed(options, (err: string | null, results: { value: number }) => {
      if (err) {
        console.error('Error getting flights climbed from HealthKit:', err);
        return;
      }
      setFlights(results.value);
      console.log('Flights Climbed (iOS):', results.value);
    });

    // ดึงระยะทางเดิน/วิ่ง
    AppleHealthKit.getDistanceWalkingRunning(options, (err: string | null, results: { value: number }) => {
      if (err) {
        console.error('Error getting distance walking/running from HealthKit:', err);
        return;
      }
      setDistance(results.value);
      console.log('Distance Walking/Running (iOS):', results.value);
    });
  };


  // Effect สำหรับเริ่มต้น HealthKit และขอสิทธิ์เมื่อคอมโพเนนต์ mount
  useEffect(() => {
    console.log('Running iOS HealthKit initialization...');
    try {
      AppleHealthKit.isAvailable((err: object, isAvailable: boolean) => {
        if (err) {
          console.error('Error checking Apple HealthKit availability:', err);
          return;
        }
        if (!isAvailable) {
          console.log('Apple Health not available on this iOS device.');
          return;
        }
        AppleHealthKit.initHealthKit(permissions, (err: string | null) => {
          if (err) {
            console.error('Error getting Apple HealthKit permissions:', err);
            return;
          }
          setHasPermission(true);
          console.log('Apple HealthKit initialized successfully and permissions granted.');
        });
      });
    } catch (e: any) { // ใช้ 'any' เพื่อให้ครอบคลุมประเภทข้อผิดพลาดทั้งหมด
      console.error('An unexpected error occurred during AppleHealthKit initialization:', e);
    }
  }, []); // รันครั้งเดียวเมื่อคอมโพเนนต์ mount

  // Effect สำหรับดึงข้อมูล HealthKit เมื่อมีสิทธิ์และวันที่เปลี่ยนไป และตั้งค่า Auto-refresh
  useEffect(() => {
    // ดึงข้อมูลทันทีเมื่อ hook ถูกเรียกใช้ (หรือเมื่อ date เปลี่ยน)
    fetchHealthKitData();

    // ตั้งค่า interval สำหรับรีเฟรชข้อมูลทุก 15 วินาที
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing HealthKit data every 15 seconds...');
      fetchHealthKitData();
    }, 15 * 1000); // 15 วินาที (15000 มิลลิวินาที)

    // Cleanup function: จะถูกเรียกเมื่อ component unmount หรือเมื่อ date เปลี่ยน (เพื่อให้ interval เก่าถูกล้างออกและเริ่มใหม่)
    return () => {
      console.log('Clearing HealthKit auto-refresh interval.');
      clearInterval(intervalId);
    };
  }, [hasPermissions, date]); // ขึ้นอยู่กับ hasPermissions และ date

  // ส่งคืนข้อมูลสุขภาพ
  return {
    steps,
    flights,
    distance,
  };
};

export default useHealthKitData;
