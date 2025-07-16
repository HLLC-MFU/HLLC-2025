"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';
import { animated } from '@react-spring/web';

type InteractiveMapProps = {
  onImageLoad?: (imageSize: { width: number; height: number }) => void;
  children?: React.ReactNode;
};

export default function InteractiveMap({ onImageLoad, children }: InteractiveMapProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 6000, height: 2469 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // ใช้ useState แทน useSpring สำหรับ pan/zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale] = useState(1); // ล็อก scale ไว้ที่ 1

  // Load image size once, and set loaded flag
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  useEffect(() => {
    const img = new window.Image();
    img.src = '/images/map.png';
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      onImageLoad?.({ width: img.width, height: img.height });
      setIsImageLoaded(true);
    };
  }, []);

  // Detect container size
  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // กำหนด initial scale ให้แผนที่แสดงผลแบบ zoom-out
  const initialScale = 0.5; // ปรับค่านี้เพื่อความกว้างที่ต้องการ

  // Helper: clamp value
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  // ปรับ clamp pan/zoom ไม่ให้ออกนอกขอบภาพ (แก้ getBounds)
  const getBounds = () => {
    const cW = window.innerWidth;
    const cH = window.innerHeight;
    const scaledWidth = imageSize.width * initialScale;
    const scaledHeight = imageSize.height * initialScale;
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    if (scaledWidth > cW) {
      minX = cW - scaledWidth;
      maxX = 0;
    }
    if (scaledHeight > cH) {
      minY = cH - scaledHeight;
      maxY = 0;
    }
    return {
      minX,
      maxX,
      minY,
      maxY,
    };
  };

  const bind = useGesture(
    {
      onDrag: ({ offset: [dx, dy], last, memo }) => {
        // scale = 1 เสมอ แต่แสดงผลด้วย initialScale
        const adjDx = dx;
        const adjDy = dy;
        const bounds = getBounds();
        const clampedX = clamp(adjDx, bounds.minX, bounds.maxX);
        const clampedY = clamp(adjDy, bounds.minY, bounds.maxY);
        setPan({ x: clampedX, y: clampedY });
        return memo;
      },
    },
    {
      drag: {
        from: () => [pan.x, pan.y],
        filterTaps: true,
        ...(isMobile ? { pointer: { touch: true } } : {}),
      },
    }
  );

  const handleMapClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    console.log('[MAP TAP]', {
      x: Math.round(clickX),
      y: Math.round(clickY),
    });
  };

  return (
    <div
      ref={containerRef}
      {...bind()}
      className="fixed top-0 left-0 w-screen h-screen bg-black overflow-hidden touch-auto z-0"
      style={{ touchAction: 'none' }}
    >
      <div
        style={{
          width: imageSize.width,
          height: imageSize.height,
          position: 'relative',
          left: 0,
          top: 0,
          transformOrigin: 'top left',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${initialScale})`,
        }}
        className=""
      >
        <img
          ref={imageRef}
          src="/images/map.png"
          alt="Map"
          className="w-full h-full pointer-events-none select-none"
          style={{ position: 'relative', zIndex: 10 }}
        />
        <div className="absolute inset-0 pointer-events-none bg-black/25 z-10" />
        <div className="absolute inset-0 z-20">
          {children}
        </div>
      </div>
    </div>
  );
}
