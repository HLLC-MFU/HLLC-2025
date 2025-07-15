'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';
import { animated, useSpring } from '@react-spring/web';

type InteractiveMapProps = {
  onImageLoad?: (imageSize: { width: number; height: number }) => void;
  children?: React.ReactNode;
};

export default function InteractiveMap({ onImageLoad, children }: InteractiveMapProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 6000, height: 2469 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // เพิ่ม pan (x, y) และ scale
  const [{ x, y, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    config: { tension: 300, friction: 30 },
  }));

  // Load image size once
  useEffect(() => {
    const img = new window.Image();
    img.src = '/images/map.png'; // Make sure it's in /public/images/
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      onImageLoad?.({ width: img.width, height: img.height });
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

  // Center map on load (reset x, y)
  useEffect(() => {
    if (!containerRef.current || !imageSize.width || !imageSize.height) return;
    const cW = window.innerWidth;
    const cH = window.innerHeight;
    const iW = imageSize.width;
    const iH = imageSize.height;
    // Center to (0,0) for now, or calculate initial x, y if needed
    api.start({ x: 0, y: 0 });
  }, [imageSize.width, imageSize.height, api]);

  // Helper: clamp value
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  // ปรับ clamp pan/zoom ไม่ให้ออกนอกขอบภาพ (แก้ getBounds)
  const getBounds = (scaleValue: number) => {
    const cW = window.innerWidth;
    const cH = window.innerHeight;
    const scaledWidth = imageSize.width * scaleValue;
    const scaledHeight = imageSize.height * scaleValue;
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
        const s = scale.get();
        // ปรับ dx, dy ให้สัมพันธ์กับ scale
        const adjDx = dx / s;
        const adjDy = dy / s;
        const bounds = getBounds(s);
        const clampedX = clamp(adjDx, bounds.minX, bounds.maxX);
        const clampedY = clamp(adjDy, bounds.minY, bounds.maxY);
        api.start({ x: clampedX, y: clampedY });
        return memo;
      },
      onPinch: ({ offset: [d], origin, memo, event }) => {
        // d: scale value
        const scaleValue = Math.max(1, Math.min(d, 3));
        // Clamp x, y to new bounds after zoom
        const bounds = getBounds(scaleValue);
        // Get current x, y
        const currentX = x.get();
        const currentY = y.get();
        const clampedX = clamp(currentX, bounds.minX, bounds.maxX);
        const clampedY = clamp(currentY, bounds.minY, bounds.maxY);
        api.start({ scale: scaleValue, x: clampedX, y: clampedY });
        return memo;
      },
    },
    {
      drag: {
        from: () => [x.get(), y.get()],
        filterTaps: true,
        ...(isMobile ? { pointer: { touch: true } } : {}),
      },
      pinch: {
        from: () => [scale.get(), 0],
        scaleBounds: { min: 1, max: 3 },
        rubberband: false,
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
      style={{}}
    >
      <animated.div
        style={{
          width: imageSize.width,
          height: imageSize.height,
          position: 'relative',
          left: 0,
          top: 0,
          transformOrigin: 'top left',
          scale,
          x,
          y,
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
        <div className="absolute inset-0 pointer-events-none bg-black/30 z-10" />
        <div className="absolute inset-0 z-20">
          {children}
        </div>
      </animated.div>
    </div>
  );
}
