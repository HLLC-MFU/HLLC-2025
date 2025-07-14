import React, { useState, useEffect } from 'react';
import { Animated } from 'react-native';
import Svg, { Line, Circle, Polygon, G, Text as SvgText } from 'react-native-svg';

// Firework SVG component (animated)
const FIREWORK_COLORS = [
  '#FFD700', '#FF69B4', '#00FFFF', '#FF4500', '#7CFC00', '#1E90FF', '#FFFFFF',
];

export function FireworkSVG({
  centerX,
  centerY,
  radius = 90,
  numRays = 12,
  duration = 1200,
  delay = 0,
}: {
  centerX: number;
  centerY: number;
  radius?: number;
  numRays?: number;
  duration?: number;
  delay?: number;
}) {
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 20,
        opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] }),
        transform: [
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] }) },
        ],
      }}
      pointerEvents="none"
    >
      <Svg width={centerX * 2} height={centerY * 2}>
        {[...Array(numRays)].map((_, i) => {
          const angle = (2 * Math.PI * i) / numRays;
          const x2 = centerX + radius * Math.cos(angle);
          const y2 = centerY + radius * Math.sin(angle);
          const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];
          return (
            <React.Fragment key={i}>
              <AnimatedLine
                x1={centerX}
                y1={centerY}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
                anim={anim}
              />
              <AnimatedCircle
                cx={x2}
                cy={y2}
                r={anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 7, 0] })}
                fill={color}
                opacity={0.8}
                anim={anim}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

// Animated SVG helpers
function AnimatedLine({ x1, y1, x2, y2, stroke, strokeWidth, strokeLinecap, anim }: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round' | 'butt' | 'square' | undefined;
  anim: Animated.Value;
}) {
  const x2Anim = anim.interpolate({ inputRange: [0, 1], outputRange: [x1, x2] });
  const y2Anim = anim.interpolate({ inputRange: [0, 1], outputRange: [y1, y2] });
  return (
    <AnimatedSvgLine
      x1={x1}
      y1={y1}
      x2={x2Anim}
      y2={y2Anim}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
    />
  );
}

function AnimatedCircle({ cx, cy, r, fill, opacity, anim }: {
  cx: number;
  cy: number;
  r: any;
  fill: string;
  opacity: number;
  anim: Animated.Value;
}) {
  return (
    <AnimatedSvgCircle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      opacity={opacity}
    />
  );
}

import { Animated as RNAnimated } from 'react-native';
const AnimatedSvgLine = RNAnimated.createAnimatedComponent(Line);
const AnimatedSvgCircle = RNAnimated.createAnimatedComponent(Circle);

// Helper for coin position (outer/inner ring)
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

// Helper for kite centroid
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