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

      return;
    }


    const options: HealthInputOptions = {
      date: date.toISOString(),
      includeManuallyAdded: false,
    };

    AppleHealthKit.getStepCount(options, (err: string | null, results: { value: number }) => {
      if (err) {
        return;
      }
      setSteps(results.value);
    });

    AppleHealthKit.getFlightsClimbed(options, (err: string | null, results: { value: number }) => {
      if (err) {
        return;
      }
      setFlights(results.value);
    });

    AppleHealthKit.getDistanceWalkingRunning(options, (err: string | null, results: { value: number }) => {
      if (err) {
        return;
      }
      setDistance(results.value);
    });
  };


  // Effect สำหรับเริ่มต้น HealthKit และขอสิทธิ์เมื่อคอมโพเนนต์ mount
  useEffect(() => {
    // 
    try {
      AppleHealthKit.isAvailable((err: object, isAvailable: boolean) => {
        if (err) {
          return;
        }
        if (!isAvailable) {
          return;
        }
        AppleHealthKit.initHealthKit(permissions, (err: string | null) => {
          if (err) {
            return;
          }
          setHasPermission(true);
        });
      });
    } catch (e: any) {}
  }, []); // รันครั้งเดียวเมื่อคอมโพเนนต์ mount

  useEffect(() => {
    fetchHealthKitData();
    const intervalId = setInterval(() => {
      fetchHealthKitData();
    }, 15 * 1000); // 15 วินาที (15000 มิลลิวินาที)

    return () => {
      clearInterval(intervalId);
    };
  }, [hasPermissions, date]);

  return {
    steps,
    flights,
    distance,
  };
};

export default useHealthKitData;
