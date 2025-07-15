'use client';

import React, { useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

const FIREWORK_COLORS = [
  '#FFD700', '#FF69B4', '#00FFFF', '#FF4500', '#7CFC00', '#1E90FF', '#FFFFFF',
];

type FireworkProps = {
  centerX: number;
  centerY: number;
  radius?: number;
  numRays?: number;
  duration?: number;
  delay?: number;
};

export function FireworkSVG({
  centerX,
  centerY,
  radius = 90,
  numRays = 12,
  duration = 1200,
  delay = 0,
}: FireworkProps) {
  const [style, api] = useSpring(() => ({
    from: { scale: 0.7, opacity: 0 },
    to: async (next) => {
      await new Promise((r) => setTimeout(r, delay));
      await next({ scale: 1.2, opacity: 1 });
      await next({ scale: 1.2, opacity: 0 });
    },
    config: { duration },
    reset: true,
  }));

  useEffect(() => {
    api.start();
  }, [api]);

  return (
    <animated.div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
        ...style,
      }}
    >
      <svg width={centerX * 2} height={centerY * 2}>
        {Array.from({ length: numRays }).map((_, i) => {
          const angle = (2 * Math.PI * i) / numRays;
          const x2 = centerX + radius * Math.cos(angle);
          const y2 = centerY + radius * Math.sin(angle);
          const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];
          return (
            <React.Fragment key={i}>
              <line
                x1={centerX}
                y1={centerY}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
              />
              <circle
                cx={x2}
                cy={y2}
                r={6}
                fill={color}
                opacity={0.8}
              />
            </React.Fragment>
          );
        })}
      </svg>
    </animated.div>
  );
}

// === Coin helper functions ===

export function getCoinPosition(
  i: number,
  NUM_SQUARES: number,
  RADIUS: number,
  KITE_INNER_RADIUS?: number,
  KITE_OUTER_RADIUS?: number,
  CENTER_X = 150,
  CENTER_Y = 170
) {
  let cx = CENTER_X;
  let cy = CENTER_Y;
  let rotate = 0;
  if (i < NUM_SQUARES) {
    const angle = (2 * Math.PI * i) / NUM_SQUARES;
    cx += RADIUS * Math.cos(angle);
    cy += RADIUS * Math.sin(angle);
    rotate = (angle * 180) / Math.PI + 45;
    return { cx, cy, rotate, x: cx - CENTER_X, y: cy - CENTER_Y };
  } else {
    const index = i - NUM_SQUARES;
    const angleMid = (2 * Math.PI * (index + 1)) / NUM_SQUARES;
    const innerRadius = 12;
    const p1 = {
      x: CENTER_X + innerRadius * Math.cos(angleMid),
      y: CENTER_Y + innerRadius * Math.sin(angleMid),
    };
    const angleIn1 = (2 * Math.PI * index) / NUM_SQUARES + Math.PI / 3.5;
    const inRadius = KITE_INNER_RADIUS ?? (RADIUS - 8);
    const p2 = {
      x: CENTER_X + inRadius * Math.cos(angleIn1),
      y: CENTER_Y + inRadius * Math.sin(angleIn1),
    };
    const angleOut = (2 * Math.PI * (index + 1)) / NUM_SQUARES - Math.PI / NUM_SQUARES;
    const outRadius = KITE_OUTER_RADIUS ?? (RADIUS + 0);
    const p3 = {
      x: CENTER_X + outRadius * Math.cos(angleOut),
      y: CENTER_Y + outRadius * Math.sin(angleOut),
    };
    const angleIn2 = (2 * Math.PI * (index + 0.9)) / NUM_SQUARES - Math.PI / 4;
    const p4 = {
      x: CENTER_X + inRadius * Math.cos(angleIn2),
      y: CENTER_Y + inRadius * Math.sin(angleIn2),
    };
    const angleMid1 = (2 * Math.PI * index) / NUM_SQUARES;
    const p6 = {
      x: CENTER_X + innerRadius * Math.cos(angleMid1),
      y: CENTER_Y + innerRadius * Math.sin(angleMid1),
    };
    cx = (p1.x + p2.x + p3.x + p4.x + p6.x) / 5;
    cy = (p1.y + p2.y + p3.y + p4.y + p6.y) / 5;
    return { cx, cy, rotate, x: cx - CENTER_X, y: cy - CENTER_Y };
  }
}

export function getKiteCentroid(
  i: number,
  NUM_SQUARES: number,
  CENTER_X: number,
  CENTER_Y: number,
  KITE_INNER_RADIUS: number,
  KITE_OUTER_RADIUS: number
) {
  const angleMid = (2 * Math.PI * (i + 1)) / NUM_SQUARES;
  const innerRadius = 12;
  const p1 = {
    x: CENTER_X + innerRadius * Math.cos(angleMid),
    y: CENTER_Y + innerRadius * Math.sin(angleMid),
  };
  const angleIn1 = (2 * Math.PI * i) / NUM_SQUARES + Math.PI / 3.5;
  const inRadius = KITE_INNER_RADIUS;
  const p2 = {
    x: CENTER_X + inRadius * Math.cos(angleIn1),
    y: CENTER_Y + inRadius * Math.sin(angleIn1),
  };
  const angleOut = (2 * Math.PI * (i + 1)) / NUM_SQUARES - Math.PI / NUM_SQUARES;
  const outRadius = KITE_OUTER_RADIUS;
  const p3 = {
    x: CENTER_X + outRadius * Math.cos(angleOut),
    y: CENTER_Y + outRadius * Math.sin(angleOut),
  };
  const angleIn2 = (2 * Math.PI * (i + 0.9)) / NUM_SQUARES - Math.PI / 4;
  const p4 = {
    x: CENTER_X + inRadius * Math.cos(angleIn2),
    y: CENTER_Y + inRadius * Math.sin(angleIn2),
  };
  const angleMid1 = (2 * Math.PI * i) / NUM_SQUARES;
  const p6 = {
    x: CENTER_X + innerRadius * Math.cos(angleMid1),
    y: CENTER_Y + innerRadius * Math.sin(angleMid1),
  };
  const centroidX = (p1.x + p2.x + p3.x + p4.x + p6.x) / 5;
  const centroidY = (p1.y + p2.y + p3.y + p4.y + p6.y) / 5;
  return { centroidX, centroidY };
}
