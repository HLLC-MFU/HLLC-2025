import React, { useRef, useEffect, useState, Fragment } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import Svg, {
  Rect,
  Circle,
  G,
  Polygon,
  Text as SvgText,
  Line, // Added Line import
} from 'react-native-svg';

// Props for controlling modal visibility, closing, and coin display
interface StampModalProps {
  visible: boolean; // Show/hide modal
  onClose: () => void; // Close modal callback
  stamps?: number;
  onGetReward?: () => void;
  coinImages?: (string | undefined)[]; // Array of coin image URIs (index 0-6: outer, 7-13: inner)
  coinRotations?: number[]; // Array of rotation angles for each coin image
  coinSizes?: number[]; // (NEW) Array of per-coin image sizes (optional)
}

// === GRID & IMAGE SIZE CONTROLS ===
const NUM_SQUARES = 7; // Number of slots per ring (outer and inner)
const RADIUS = 80; // Radius from center to outer ring (distance from center to outer slot)
const RECT_SIZE = 0; // Size of the square frame (Rect) only
const SQUARE_SIZE = 85; // Size of each coin image (and overlay)
const KITE_INNER_RADIUS = RADIUS - 8; // Inner radius for kite polygon (smaller frame)
const KITE_OUTER_RADIUS = RADIUS + 0; // Outer radius for kite polygon (smaller frame)
const CENTER_X = 150; // X coordinate of grid center (SVG)
const CENTER_Y = 170; // Y coordinate of grid center (SVG)

// Firework SVG component (animated)
const FIREWORK_COLORS = [
  '#FFD700', // gold
  '#FF69B4', // pink
  '#00FFFF', // cyan
  '#FF4500', // orange
  '#7CFC00', // green
  '#1E90FF', // blue
  '#FFFFFF', // white
];

function FireworkSVG({
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
        position: 'absolute',
        left: 0, top: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
        opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] }),
        transform: [
          {
            scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] }),
          },
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
            <Fragment key={i}>
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
              {/* จุดปลายพลุ */}
              <AnimatedCircle
                cx={x2}
                cy={y2}
                r={anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 7, 0] })}
                fill={color}
                opacity={0.8}
                anim={anim}
              />
            </Fragment>
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
  // Animate length of line (from center to end)
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
  r: any; // Animated.Value or number
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

// Animated SVG wrappers
import { Animated as RNAnimated } from 'react-native';
const AnimatedSvgLine = RNAnimated.createAnimatedComponent(Line);
const AnimatedSvgCircle = RNAnimated.createAnimatedComponent(Circle);


export default function StampModal({
  visible,
  onClose,
  coinImages = [],
  coinRotations = [],
  coinSizes = [], // (NEW) per-coin image sizes
}: StampModalProps) {
  // Animated opacity for each coin image (for fade-in effect)
  const fadeAnims = useRef<Animated.Value[]>(
    [...Array(14)].map(() => new Animated.Value(0)),
  ).current;

  // === NEW: Animation for new coin effect ===
  const [newCoinIndex, setNewCoinIndex] = useState<number | null>(null);
  const [showNewCoinEffect, setShowNewCoinEffect] = useState(false);
  const newCoinAnim = useRef(new Animated.Value(0)).current;
  const newCoinScale = useRef(new Animated.Value(0.3)).current;
  const newCoinPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Track previous coinImages to detect new coins
  const prevCoinImages = useRef<(string | undefined)[]>([]);

  // Detect new coins and trigger animation
  useEffect(() => {
    if (visible && coinImages.length > 0) {
      const newCoins = coinImages.map((img, index) => {
        const hadCoin = prevCoinImages.current[index];
        const hasCoin = !!img;
        return hasCoin && !hadCoin ? index : null;
      }).filter((index): index is number => index !== null);

      if (newCoins.length > 0) {
        const latestNewCoin = newCoins[newCoins.length - 1];
        setNewCoinIndex(latestNewCoin);
        setShowNewCoinEffect(true);
        
        // Reset animation values
        newCoinAnim.setValue(0);
        newCoinScale.setValue(0.3);
        newCoinPosition.setValue({ x: 0, y: 0 });

        // Animate new coin effect
        Animated.parallel([
          Animated.timing(newCoinAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(newCoinScale, {
            toValue: 1.5,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // After animation, reset for next time
          setTimeout(() => {
            setShowNewCoinEffect(false);
            setNewCoinIndex(null);
          }, 500);
        });
      }
    }
    
    // Update previous coin images
    prevCoinImages.current = [...coinImages];
  }, [visible, coinImages]);

  // === Glow effect for complete collection ===
  const isComplete = coinImages.filter(Boolean).length === 14;
  const glowAnim = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    if (isComplete && visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0.7);
    }
  }, [isComplete, visible]);

  // Firework trigger state (show only once per complete)
  const [showFirework, setShowFirework] = useState(false);
  useEffect(() => {
    if (isComplete && visible) {
      setShowFirework(true);
      // Hide firework after 1.5s
      const t = setTimeout(() => setShowFirework(false), 1500);
      return () => clearTimeout(t);
    } else {
      setShowFirework(false);
    }
  }, [isComplete, visible]);

  useEffect(() => {
    if (visible) {
      // Animate all coins with staggered delay
      coinImages.forEach((_, index) => {
        Animated.timing(fadeAnims[index], {
          toValue: 1,
          duration: 400,
          delay: index * 100, // Staggered delay
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Reset all for next open
      fadeAnims.forEach(anim => anim.setValue(0));
    }
  }, [visible, coinImages, coinRotations, coinSizes]);

  // Handle tap to place coin in slot
  const handleTapToPlace = () => {
    if (showNewCoinEffect && newCoinIndex !== null) {
      // Animate coin to its final position
      let targetX = 0;
      let targetY = 0;

      if (newCoinIndex < NUM_SQUARES) {
        // Outer ring position
        const angle = (2 * Math.PI * newCoinIndex) / NUM_SQUARES;
        targetX = RADIUS * Math.cos(angle);
        targetY = RADIUS * Math.sin(angle);
      } else {
        // Inner ring position (centroid calculation)
        const index = newCoinIndex - NUM_SQUARES;
        const angleMid = (2 * Math.PI * (index + 1)) / NUM_SQUARES;
        const innerRadius = 12;
        const p1 = {
          x: innerRadius * Math.cos(angleMid),
          y: innerRadius * Math.sin(angleMid),
        };
        const angleIn1 = (2 * Math.PI * index) / NUM_SQUARES + Math.PI / 3.5;
        const inRadius = KITE_INNER_RADIUS;
        const p2 = {
          x: inRadius * Math.cos(angleIn1),
          y: inRadius * Math.sin(angleIn1),
        };
        const angleOut = (2 * Math.PI * (index + 1)) / NUM_SQUARES - Math.PI / NUM_SQUARES;
        const outRadius = KITE_OUTER_RADIUS;
        const p3 = {
          x: outRadius * Math.cos(angleOut),
          y: outRadius * Math.sin(angleOut),
        };
        const angleIn2 = (2 * Math.PI * (index + 0.9)) / NUM_SQUARES - Math.PI / 4;
        const p4 = {
          x: inRadius * Math.cos(angleIn2),
          y: inRadius * Math.sin(angleIn2),
        };
        const angleMid1 = (2 * Math.PI * index) / NUM_SQUARES;
        const p6 = {
          x: innerRadius * Math.cos(angleMid1),
          y: innerRadius * Math.sin(angleMid1),
        };
        targetX = (p1.x + p2.x + p3.x + p4.x + p6.x) / 5;
        targetY = (p1.y + p2.y + p3.y + p4.y + p6.y) / 5;
      }

      Animated.parallel([
        Animated.timing(newCoinPosition, {
          toValue: { x: targetX, y: targetY },
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(newCoinScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowNewCoinEffect(false);
        setNewCoinIndex(null);
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={showNewCoinEffect ? handleTapToPlace : undefined}
      >
        <View style={styles.modalContent}>
          <Text style={styles.title}>Collection</Text>
          <View style={styles.stampHexGridContainer}>
            {/* Firework effect when complete */}
            {showFirework && (
              <>
                <FireworkSVG centerX={CENTER_X} centerY={CENTER_Y} radius={110} numRays={14} duration={1200} />
                {/* เพิ่มพลุซ้อนอีกชุดให้ดูอลังการ */}
                <FireworkSVG centerX={CENTER_X} centerY={CENTER_Y} radius={70} numRays={7} duration={900} delay={200} />
              </>
            )}
            {/* Glow effect when complete */}
            {isComplete && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0, top: 0, right: 0, bottom: 0,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: glowAnim,
                  zIndex: 1,
                }}
                pointerEvents="none"
              >
                <Svg width={CENTER_X * 2} height={CENTER_Y * 2}>
                  <Circle
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={RADIUS + 40}
                    fill="rgba(255,255,120,0.25)"
                  />
                  <Circle
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={RADIUS + 20}
                    fill="rgba(255,255,200,0.18)"
                  />
                </Svg>
              </Animated.View>
            )}
            {/* SVG grid for slots (outer ring: squares, inner ring: kites) */}
            <Svg width={CENTER_X * 2} height={CENTER_Y * 2}>
              {/* Center circle (visual reference) */}
              <Circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={12}
                fill="transparent"
                stroke="#fff"
                strokeWidth={1}
              />

              {/* Outer ring: 7 squares */}
              {[...Array(NUM_SQUARES)].map((_, i) => {
                // Calculate position and rotation for each square slot
                const angle = (2 * Math.PI * i) / NUM_SQUARES;
                const cx = CENTER_X + RADIUS * Math.cos(angle); // X position
                const cy = CENTER_Y + RADIUS * Math.sin(angle); // Y position
                const rotate = (angle * 180) / Math.PI + 45; // Rotation for square

                return (
                  <G key={i} origin={`${cx},${cy}`} rotation={rotate}>
                    {/* Slot rectangle (gray if empty, transparent if has coin) */}
                    <Rect
                      x={cx - RECT_SIZE / 2}
                      y={cy - RECT_SIZE / 2}
                      width={RECT_SIZE}
                      height={RECT_SIZE}
                      fill={coinImages[i] ? 'transparent' : 'gray'}
                      stroke={coinImages[i] ? 'transparent' : '#fff'}
                      strokeWidth={2}
                    />
                    {/* Slot number label */}
                    <SvgText
                      x={cx + RECT_SIZE / 2 - 14}
                      y={cy - RECT_SIZE / 2 + 20}
                      fontSize={18}
                      fontWeight="bold"
                      fill="#fff"
                      textAnchor="end"
                      alignmentBaseline="hanging"
                      stroke="#222"
                      strokeWidth={0.5}
                    >
                      {/* {i + 1} */}
                    </SvgText>
                  </G>
                );
              })}

              {/* Inner ring: 7 kite-shaped slots */}
              {[...Array(NUM_SQUARES)].map((_, i) => {
                // Calculate kite points for each inner slot
                const angleMid = (2 * Math.PI * (i + 1)) / NUM_SQUARES;
                const innerRadius = 12;
                const p1 = {
                  x: CENTER_X + innerRadius * Math.cos(angleMid),
                  y: CENTER_Y + innerRadius * Math.sin(angleMid),
                };

                const angleIn1 =
                  (2 * Math.PI * i) / NUM_SQUARES + Math.PI / 3.5;
                const inRadius = KITE_INNER_RADIUS; // Use custom inner radius for smaller polygon
                const p2 = {
                  x: CENTER_X + inRadius * Math.cos(angleIn1),
                  y: CENTER_Y + inRadius * Math.sin(angleIn1),
                };

                const angleOut =
                  (2 * Math.PI * (i + 1)) / NUM_SQUARES - Math.PI / NUM_SQUARES;
                const outRadius = KITE_OUTER_RADIUS; // Use custom outer radius for smaller polygon
                const p3 = {
                  x: CENTER_X + outRadius * Math.cos(angleOut),
                  y: CENTER_Y + outRadius * Math.sin(angleOut),
                };

                const angleIn2 =
                  (2 * Math.PI * (i + 0.9)) / NUM_SQUARES - Math.PI / 4;
                const p4 = {
                  x: CENTER_X + inRadius * Math.cos(angleIn2),
                  y: CENTER_Y + inRadius * Math.sin(angleIn2),
                };

                const angleMid1 = (2 * Math.PI * i) / NUM_SQUARES;
                const p6 = {
                  x: CENTER_X + innerRadius * Math.cos(angleMid1),
                  y: CENTER_Y + innerRadius * Math.sin(angleMid1),
                };

                // Centroid for label and coin image
                const centroidX = (p1.x + p2.x + p3.x + p4.x + p6.x) / 5;
                const centroidY = (p1.y + p2.y + p3.y + p4.y + p6.y) / 5;

                return (
                  <G key={`kite-${i}`}>
                    {/* Kite polygon (gray if empty, transparent if has coin) */}
                    <Polygon
                      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p6.x},${p6.y}`}
                      fill={
                        coinImages[i + NUM_SQUARES] ? 'transparent' : 'gray'
                      }
                      stroke={coinImages[i + NUM_SQUARES] ? 'transparent' : '#fff'}
                      strokeWidth={1}
                    />

                    {/* Slot number label */}
                    <SvgText
                      x={centroidX}
                      y={centroidY + 6}
                      fontSize={18}
                      fontWeight="bold"
                      fill="#fff"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      stroke="#222"
                      strokeWidth={0.5}
                    >
                      {/* {i + 8} */}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>

            {/* Coin image overlay with animation */}
            {[...Array(14)].map((_, i) => {
              if (!coinImages[i]) return null; // No image, skip

              let cx = CENTER_X;
              let cy = CENTER_Y;

              if (i < NUM_SQUARES) {
                // Outer ring: calculate position using RADIUS
                const angle = (2 * Math.PI * i) / NUM_SQUARES;
                cx += RADIUS * Math.cos(angle);
                cy += RADIUS * Math.sin(angle);
              } else {
                // Inner ring: use centroid of kite slot
                const index = i - NUM_SQUARES;

                const angleMid = (2 * Math.PI * (index + 1)) / NUM_SQUARES;
                const innerRadius = 12;
                const p1 = {
                  x: CENTER_X + innerRadius * Math.cos(angleMid),
                  y: CENTER_Y + innerRadius * Math.sin(angleMid),
                };

                const angleIn1 =
                  (2 * Math.PI * index) / NUM_SQUARES + Math.PI / 3.5;
                const inRadius = KITE_INNER_RADIUS; // Use custom inner radius for smaller polygon
                const p2 = {
                  x: CENTER_X + inRadius * Math.cos(angleIn1),
                  y: CENTER_Y + inRadius * Math.sin(angleIn1),
                };

                const angleOut =
                  (2 * Math.PI * (index + 1)) / NUM_SQUARES -
                  Math.PI / NUM_SQUARES;
                const outRadius = KITE_OUTER_RADIUS; // Use custom outer radius for smaller polygon
                const p3 = {
                  x: CENTER_X + outRadius * Math.cos(angleOut),
                  y: CENTER_Y + outRadius * Math.sin(angleOut),
                };

                const angleIn2 =
                  (2 * Math.PI * (index + 0.9)) / NUM_SQUARES - Math.PI / 4;
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
              }

              const rotate = coinRotations[i] ?? 0; // Rotation for this coin
              const size = coinSizes[i] ?? SQUARE_SIZE; // (NEW) Per-coin size if provided, fallback to SQUARE_SIZE

              return (
                <Animated.View
                  key={`img-${i}`}
                  style={{
                    position: 'absolute',
                    left: cx - size / 2, // Center image on slot using per-coin size
                    top: cy - size / 2,
                    width: size, // (NEW) Per-coin image size
                    height: size,
                    transform: [{ rotate: `${rotate}deg` }],
                    opacity: fadeAnims[i],
                    // zIndex: 10 ensures coin is above slot
                    zIndex: 10,
                  }}
                >
                  <Image
                    source={{ uri: coinImages[i] }}
                    style={{
                      width: '100%',
                      height: '100%',
                      resizeMode: 'contain',
                    }}
                  />
                </Animated.View>
              );
            })}

            {/* New coin effect overlay */}
            {showNewCoinEffect && newCoinIndex !== null && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0, top: 0, right: 0, bottom: 0,
                  alignItems: 'center', justifyContent: 'center',
                  zIndex: 25, // Ensure it's above other content
                }}
                onTouchEnd={handleTapToPlace} // Allow tapping to place
              >
                <Animated.View
                  style={{
                    transform: [
                      { translateX: newCoinPosition.x },
                      { translateY: newCoinPosition.y },
                      { scale: newCoinScale },
                      { rotate: newCoinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                    ],
                    opacity: newCoinAnim,
                  }}
                >
                  <Image
                    source={{ uri: coinImages[newCoinIndex] }}
                    style={{
                      width: 50,
                      height: 50,
                      resizeMode: 'contain',
                    }}
                  />
                </Animated.View>
              </Animated.View>
            )}
          </View>

          <TouchableOpacity
            style={styles.rewardBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.rewardBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  stampHexGridContainer: {
    width: 300, // Container width for grid (increase if grid is too big)
    height: 340, // Container height for grid
    position: 'relative',
    marginVertical: 24,
  },
  rewardBtn: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  rewardBtnText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
