"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";
import {
  Card,
  CardHeader,
  CardBody,
  Select,
  SelectItem,
} from "@heroui/react";

const Home: React.FC = () => {
  const [result, setResult] = useState<string>("");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner";

  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices: CameraDevice[]) => {
        if (!isMounted) return;
        setCameras(devices);

        // หา camera label ที่มีคำว่า back หรือ rear
        const backCamera = devices.find((d) =>
          /back|rear/i.test(d.label)
        );
        // ถ้าเจอใช้ backCamera.id มิฉะนั้นใช้ id ตัวแรก
        setSelectedCam(
          backCamera ? backCamera.id : devices[0]?.id ?? null
        );
      })
      .catch((error: unknown) => {
        console.error("getCameras error:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. เริ่มสแกนเมื่อ selectedCam เปลี่ยน
  useEffect(() => {
    if (!selectedCam) return;

    // สร้าง instance ใหม่ทุกครั้งเพื่อล้าง state เก่า
    const html5QrCode = new Html5Qrcode(containerId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        selectedCam!,
        {
          fps: 10,
          // ทำให้ preview เป็นสัดส่วน 1:1
          aspectRatio: 1.0,
          // qrbox เป็นฟังก์ชัน จับเอาค่าของ viewfinder มา 0.8 (80%) เพื่อลดขอบให้เล็กลง
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.8;
            return { width: size, height: size };
          },
        },
        (decodedText) => setResult(decodedText),
        (error) => console.warn("QR scan error:", error)
      )
      .catch(console.error);


    return () => {
      html5QrCode.stop().catch(() => {
        /* ignore if not running */
      });
    };
  }, [selectedCam]);

  return (
    <section className="flex flex-col items-center gap-6 p-6">
      

      {/* สแกน QR */}
      <Card className="max-w-sm w-full flex flex-col">
        <CardHeader>Activity Check‑In</CardHeader>
        <CardBody className="flex-1 flex flex-col items-center justify-center">
          <div>
            <Select
              className="w-full"
              label="Camera"
              placeholder="Select camera"
              selectedKeys={selectedCam ? new Set([selectedCam]) : new Set()}
              onSelectionChange={(keys) => {
                const [camId] = Array.from(keys) as string[];
                setSelectedCam(camId);
              }}
            >
              {cameras.map((cam) => (
                <SelectItem key={cam.id} textValue={cam.label}>
                  {cam.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div
            id={containerId}
            className="w-full h-full overflow-hidden relative"
          >
            <style jsx global>{`
              #${containerId} video {
                object-fit: cover;
                width: 100%;
                height: 100%;
              }
            `}</style>
          </div>
        </CardBody>
      </Card>

      {result && (
        <p className="mt-4 text-center font-mono text-sm">
          ผลลัพธ์: {result}
        </p>
      )}
    </section>
  );
};

export default Home;
