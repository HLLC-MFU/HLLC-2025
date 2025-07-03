// useHealthConnectData.tsx
import { useEffect, useState } from 'react';
import {
    initialize,
    requestPermission,
    readRecords,
    Permission,
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';
import {
    // นำเข้า type ที่จำเป็นสำหรับการระบุชนิดข้อมูลที่อ่านได้
    StepsRecord,
    DistanceRecord,
    FloorsClimbedRecord
} from 'react-native-health-connect';

/**
 * Custom hook for fetching health data from Health Connect on Android.
 * @param {Date} date - The date for which to fetch health data.
 * @returns {{steps: number, flights: number, distance: number}} - An object containing steps, flights climbed, and distance walked/run.
 */
const useHealthConnectData = (date: Date) => {
    // State สำหรับเก็บข้อมูลสุขภาพ
    const [steps, setSteps] = useState<number>(0);
    const [flights, setFlights] = useState<number>(0);
    const [distance, setDistance] = useState<number>(0);

    // ฟังก์ชัน Asynchronous สำหรับอ่านข้อมูลจาก Health Connect
    const readHealthConnectData = async () => {
        console.log('Running Android Health Connect data fetch for date:', date.toISOString());
        try {
            // Initialize the Health Connect client
            const isInitialized: boolean = await initialize();
            if (!isInitialized) {
                console.log('Health Connect client could not be initialized. Please ensure Health Connect app is available.');
                return;
            }
            console.log('Health Connect client initialized.');

            // Request permissions for relevant data types
            const grantedPermissions: Permission[] = await requestPermission([
                { accessType: 'read', recordType: 'Steps' },
                { accessType: 'read', recordType: 'Distance' },
                { accessType: 'read', recordType: 'FloorsClimbed' },
            ]);

            if (grantedPermissions.length < 3) { // ตรวจสอบว่าได้สิทธิ์ครบถ้วนหรือไม่
                console.warn('Not all Health Connect permissions were granted. Data might be incomplete.');
                // คุณอาจต้องการแสดงข้อความแจ้งเตือนผู้ใช้ให้ไปอนุมัติสิทธิ์
            }
            console.log('Health Connect granted permissions:', grantedPermissions);

            // กำหนดช่วงเวลาสำหรับดึงข้อมูล
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0); // ตั้งค่าเป็น 00:00:00:000 ของวันนั้น
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999); // ตั้งค่าเป็น 23:59:59:999 ของวันนั้น

            const timeRangeFilter: TimeRangeFilter = {
                operator: 'between',
                startTime: startOfDay.toISOString(),
                endTime: endOfDay.toISOString(),
            };

            // อ่านข้อมูล Steps
            const stepsResponse = await readRecords('Steps', { timeRangeFilter });
            console.log('Raw stepsResponse from Health Connect:', stepsResponse);
            const stepsRecords: StepsRecord[] = (stepsResponse?.records || []).map(record => ({
                ...record,
                recordType: 'Steps',
            }));
            const totalSteps = Array.isArray(stepsRecords) ? stepsRecords.reduce((sum: number, cur: StepsRecord) => sum + cur.count, 0) : 0;
            setSteps(totalSteps);
            console.log('Steps (Android):', totalSteps);

            // อ่านข้อมูล Distance
            const distanceResponse = await readRecords('Distance', { timeRangeFilter });
            console.log('Raw distanceResponse from Health Connect:', distanceResponse);
            const distanceRecords: DistanceRecord[] = (distanceResponse?.records || []).map(record => ({
                ...record,
                recordType: 'Distance',
                distance: {
                    value: record.distance.inMeters,
                    unit: 'meters',
                },
            }));
            const totalDistance = Array.isArray(distanceRecords)
                ? distanceRecords.reduce(
                    (sum: number, cur: DistanceRecord) => sum + cur.distance.value,
                    0
                )
                : 0;
            console.log('Distance (Android):', totalDistance);

            // อ่านข้อมูล Floors Climbed
            const floorsClimbedResponse = await readRecords('FloorsClimbed', {
                timeRangeFilter,
            });
            console.log('Raw floorsClimbedResponse from Health Connect:', floorsClimbedResponse);
            const floorsClimbedRecords: FloorsClimbedRecord[] = (floorsClimbedResponse?.records || []).map(record => ({
                ...record,
                recordType: 'FloorsClimbed',
            }));
            const totalFloors = Array.isArray(floorsClimbedRecords) ? floorsClimbedRecords.reduce((sum: number, cur: FloorsClimbedRecord) => sum + cur.floors, 0) : 0;
            setFlights(totalFloors);
            console.log('Floors Climbed (Android):', totalFloors);

        } catch (error: any) {
            console.error('An error occurred while reading Health Connect data on Android:', error);
            // ตั้งค่าข้อมูลเป็น 0 ในกรณีเกิดข้อผิดพลาด
            setSteps(0);
            setFlights(0);
            setDistance(0);
        }
    };

    // useEffect สำหรับการดึงข้อมูลเริ่มต้นและตั้งค่า Auto-refresh
    useEffect(() => {
        // ดึงข้อมูลทันทีเมื่อ hook ถูกเรียกใช้ (หรือเมื่อ date เปลี่ยน)
        readHealthConnectData();

        // ตั้งค่า interval สำหรับรีเฟรชข้อมูลทุก 15 วินาที
        const intervalId = setInterval(() => {
            console.log('Auto-refreshing Health Connect data every 15 seconds...');
            readHealthConnectData();
        }, 15 * 1000); // 15 วินาที (15000 มิลลิวินาที)

        // Cleanup function: จะถูกเรียกเมื่อ component unmount หรือเมื่อ date เปลี่ยน (เพื่อให้ interval เก่าถูกล้างออกและเริ่มใหม่)
        return () => {
            console.log('Clearing Health Connect auto-refresh interval.');
            clearInterval(intervalId);
        };
    }, [date]); // date เป็น dependency: เมื่อ date เปลี่ยน, effect จะรันใหม่

    return {
        steps,
        flights,
        distance,
    };
};

export default useHealthConnectData;
