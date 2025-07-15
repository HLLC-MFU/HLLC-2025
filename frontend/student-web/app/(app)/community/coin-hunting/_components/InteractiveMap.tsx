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

  // --- REMOVE gesture pan, keep only zoom ---
  const [{ scale }, api] = useSpring(() => ({
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

  // Scroll to center of image when loaded
  useEffect(() => {
    if (!containerRef.current || !imageSize.width || !imageSize.height) return;
    const cW = window.innerWidth;
    const cH = window.innerHeight;
    const iW = imageSize.width;
    const iH = imageSize.height;
    if (iW > cW || iH > cH) {
      const left = Math.max(0, (iW - cW) / 2);
      const top = Math.max(0, (iH - cH) / 2);
      containerRef.current.scrollTo({ left, top, behavior: 'auto' });
    }
  }, [imageSize.width, imageSize.height]);

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
      minX = (cW - scaledWidth) / 2;
      maxX = (scaledWidth - cW) / 2;
    }
    if (scaledHeight > cH) {
      minY = (cH - scaledHeight) / 2;
      maxY = (scaledHeight - cH) / 2;
    }
    return {
      minX: -maxX,
      maxX: -minX,
      minY: -maxY,
      maxY: -minY,
    };
  };

  const bind = useGesture(
    {
      onPinch: ({ offset: [d], memo }) => {
        const scaleValue = Math.max(1, Math.min(d, 3));
        api.start({ scale: scaleValue });
        return memo;
      },
    },
    {
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
      className="fixed top-0 left-0 w-screen h-screen bg-black overflow-auto touch-auto z-0"
      style={{}}
    >
      <animated.div
        style={{
          scale,
          width: imageSize.width,
          height: imageSize.height,
          position: 'relative',
          left: 0,
          top: 0,
          transformOrigin: 'top left',
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
