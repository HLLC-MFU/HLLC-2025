import React, { useRef, useEffect, useState } from 'react';
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
} from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import {
  FireworkSVG,
  getCoinPosition,
  getKiteCentroid,
} from './coin-hunting-helpers';

interface StampModalProps {
  visible: boolean;
  onClose: () => void;
  stamps?: number;
  onGetReward?: () => void;
  coinImages?: (string | undefined)[];
  coinRotations?: number[];
  coinSizes?: number[];
}

const NUM_SQUARES = 7;
const RADIUS = 80;
const SQUARE_SIZE = 85;
const KITE_INNER_RADIUS = RADIUS - 8;
const KITE_OUTER_RADIUS = RADIUS + 0;
const CENTER_X = 150;
const CENTER_Y = 170;

export default function StampModal({
  visible,
  onClose,
  coinImages = [],
  coinRotations = [],
  coinSizes = [],
}: StampModalProps) {
  const { t } = useTranslation();
  const NUM_SLOTS = 21;
  const fadeAnims = useRef(
    [...Array(NUM_SLOTS)].map(() => new Animated.Value(0)),
  ).current;
  const [newCoinIndex, setNewCoinIndex] = useState<number | null>(null);
  const [showNewCoinEffect, setShowNewCoinEffect] = useState(false);
  const newCoinAnim = useRef(new Animated.Value(0)).current;
  const newCoinScale = useRef(new Animated.Value(0.3)).current;
  const newCoinPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const prevCoinImages = useRef<(string | undefined)[]>([]);
  useEffect(() => {
    if (visible && coinImages.length > 0) {
      const newCoins = coinImages
        .map((img, index) => {
          const hadCoin = prevCoinImages.current[index];
          const hasCoin = !!img;
          return hasCoin && !hadCoin ? index : null;
        })
        .filter((index): index is number => index !== null);
      if (newCoins.length > 0) {
        const latestNewCoin = newCoins[newCoins.length - 1];
        setNewCoinIndex(latestNewCoin);
        setShowNewCoinEffect(true);
        // Get target position for the new coin
        const { x: targetX, y: targetY } = getCoinPosition(
          latestNewCoin,
          NUM_SQUARES,
          RADIUS,
          KITE_INNER_RADIUS,
          KITE_OUTER_RADIUS,
          CENTER_X,
          CENTER_Y,
        );
        // Set initial position to target position (no movement)
        newCoinPosition.setValue({ x: targetX, y: targetY });
        newCoinScale.setValue(0.3);
        newCoinAnim.setValue(0);
        // Only animate scale and rotation, no position movement
        Animated.parallel([
          Animated.timing(newCoinAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(newCoinScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => {
            setShowNewCoinEffect(false);
            setNewCoinIndex(null);
          }, 300);
        });
      }
    }
    prevCoinImages.current = [...coinImages];
  }, [visible, coinImages]);
  const isComplete = coinImages.slice(0, 14).every(Boolean);
  const glowAnim = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    if (isComplete && visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.7,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      glowAnim.setValue(0.7);
    }
  }, [isComplete, visible]);
  const [showFirework, setShowFirework] = useState(false);
  useEffect(() => {
    if (isComplete && visible) {
      setShowFirework(true);
      const t = setTimeout(() => setShowFirework(false), 1500);
      return () => clearTimeout(t);
    } else {
      setShowFirework(false);
    }
  }, [isComplete, visible]);
  useEffect(() => {
    if (visible) {
      coinImages.forEach((_, index) => {
        Animated.timing(fadeAnims[index], {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    } else {
      fadeAnims.forEach(anim => anim.setValue(0));
    }
  }, [visible, coinImages, coinRotations, coinSizes]);
  const [currentPage, setCurrentPage] = useState(0);
  useEffect(() => {
    if (visible) setCurrentPage(0);
  }, [visible]);
  const handleTapToPlace = () => {
    if (showNewCoinEffect && newCoinIndex !== null) {
      const { x: targetX, y: targetY } = getCoinPosition(
        newCoinIndex,
        NUM_SQUARES,
        RADIUS,
        KITE_INNER_RADIUS,
        KITE_OUTER_RADIUS,
      );
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
          <Text style={styles.title}>
            {currentPage === 0
              ? t('coinHunting.collection')
              : t('coinHunting.sponsorCollection')}
          </Text>
          <View style={styles.stampHexGridContainer}>
            {currentPage === 0 && showFirework && (
              <>
                <FireworkSVG
                  centerX={CENTER_X}
                  centerY={CENTER_Y}
                  radius={110}
                  numRays={14}
                  duration={1200}
                />
                <FireworkSVG
                  centerX={CENTER_X}
                  centerY={CENTER_Y}
                  radius={70}
                  numRays={7}
                  duration={900}
                  delay={200}
                />
              </>
            )}
            {currentPage === 0 && isComplete && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
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
            {currentPage === 0 && (
              <>
                <Svg width={CENTER_X * 2} height={CENTER_Y * 2}>
                  <Circle
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={12}
                    fill="transparent"
                  />
                  {[...Array(NUM_SQUARES)].map((_, i) => {
                    const { cx, cy, rotate } = getCoinPosition(
                      i,
                      NUM_SQUARES,
                      RADIUS,
                    );
                    return (
                      <G key={i} origin={`${cx},${cy}`} rotation={rotate}>
                        <Rect
                          x={cx}
                          y={cy}
                          width={0}
                          height={0}
                          fill={'transparent'}
                        />
                      </G>
                    );
                  })}
                  {[...Array(NUM_SQUARES)].map((_, i) => {
                    const { centroidX, centroidY } = getKiteCentroid(
                      i,
                      NUM_SQUARES,
                      CENTER_X,
                      CENTER_Y,
                      KITE_INNER_RADIUS,
                      KITE_OUTER_RADIUS,
                    );
                    return (
                      <G key={`kite-${i}`}>
                        <Polygon points="" fill={'transparent'} />
                        <SvgText
                          x={centroidX}
                          y={centroidY + 6}
                          fontSize={18}
                          fontWeight="bold"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        />
                      </G>
                    );
                  })}
                </Svg>
                {[...Array(14)].map((_, i) => {
                  if (!coinImages[i]) return null;
                  let { cx, cy } = getCoinPosition(
                    i,
                    NUM_SQUARES,
                    RADIUS,
                    KITE_INNER_RADIUS,
                    KITE_OUTER_RADIUS,
                    CENTER_X,
                    CENTER_Y,
                  );
                  const rotate = coinRotations[i] ?? 0;
                  const size = coinSizes[i] ?? SQUARE_SIZE;
                  return (
                    <Animated.View
                      key={`img-${i}`}
                      style={{
                        position: 'absolute',
                        left: cx - size / 2,
                        top: cy - size / 2,
                        width: size,
                        height: size,
                        transform: [{ rotate: `${rotate}deg` }],
                        opacity: fadeAnims[i],
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
                {showNewCoinEffect &&
                  newCoinIndex !== null &&
                  newCoinIndex < 14 && (
                    <Animated.View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 25,
                      }}
                      onTouchEnd={handleTapToPlace}
                    >
                      <Animated.View
                        style={{
                          transform: [
                            { translateX: newCoinPosition.x },
                            { translateY: newCoinPosition.y },
                            { scale: newCoinScale },
                            {
                              rotate: newCoinAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg'],
                              }),
                            },
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
              </>
            )}
            {currentPage === 1 && (
              <View style={styles.sponsor2RowsContainer}>
                <View style={styles.sponsorRow2Row}>
                  {[0, 1, 2].map(i => {
                    const idx = 15 + i;
                    return (
                      <View key={idx} style={styles.sponsorStampSlot}>
                        {coinImages[idx] && (
                          <Image
                            source={{ uri: coinImages[idx] }}
                            style={styles.sponsorStampImg}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
                <View
                  style={[
                    styles.sponsorRow2Row,
                    styles.sponsorRow2RowBottomHex,
                  ]}
                >
                  {[3, 4, 5, 6].map(i => {
                    const idx = 15 + i;
                    return (
                      <View key={idx} style={styles.sponsorStampSlot}>
                        {coinImages[idx] && (
                          <Image
                            source={{ uri: coinImages[idx] }}
                            style={styles.sponsorStampImg}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
          <View style={styles.dotIndicatorContainer}>
            {[0, 1].map(idx => (
              <View
                key={idx}
                style={[styles.dot, currentPage === idx && styles.dotActive]}
              />
            ))}
          </View>
          <View style={styles.pageNavBtnContainer}>
            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                currentPage === 0 && styles.pageNavBtnDisabled,
              ]}
              onPress={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pageNavBtnText,
                  currentPage === 0 && styles.pageNavBtnTextDisabled,
                ]}
              >
                {'←'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                currentPage === 1 && styles.pageNavBtnDisabled,
              ]}
              onPress={() => currentPage < 1 && setCurrentPage(currentPage + 1)}
              disabled={currentPage === 1}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pageNavBtnText,
                  currentPage === 1 && styles.pageNavBtnTextDisabled,
                ]}
              >
                {'→'}
              </Text>
            </TouchableOpacity>
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
    width: 300,
    height: 340,
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
  sponsor2RowsContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  sponsorRow2Row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  sponsorRow2RowBottomHex: { marginTop: 22, alignSelf: 'center' },
  sponsorStampSlot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sponsorStampImg: { width: 48, height: 48, resizeMode: 'contain' },
  dotIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: -10,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#bbb',
    marginHorizontal: 4,
    opacity: 0.5,
  },
  dotActive: { backgroundColor: '#fff', opacity: 1 },
  pageNavBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  pageNavBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    opacity: 1,
    borderWidth: 0,
  },
  pageNavBtnDisabled: { backgroundColor: '#bbb', opacity: 0.5 },
  pageNavBtnText: { fontSize: 22, color: '#222', fontWeight: 'bold' },
  pageNavBtnTextDisabled: { color: '#888' },
});
