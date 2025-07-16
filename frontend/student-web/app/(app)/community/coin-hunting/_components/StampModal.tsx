"use client"

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

import {
  FireworkSVG,
  getCoinPosition,
  getKiteCentroid,
} from './CoinHuntingHelpers'; 

import { useLanguage } from '@/context/LanguageContext';
import i18n from '@/locales/i18n';

interface StampModalProps {
  visible: boolean;
  onClose: () => void;
  coinImages?: (string | undefined)[];
  coinRotations?: number[];
  coinSizes?: number[];
}

const NUM_SQUARES = 7;
const RADIUS = 80;
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
  const NUM_SLOTS = 21;
  const [newCoinIndex, setNewCoinIndex] = useState<number | null>(null);
  const [showNewCoinEffect, setShowNewCoinEffect] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showFirework, setShowFirework] = useState(false);
  const [hasModalOpened, setHasModalOpened] = useState(false);

  // Detect new coins
  const [prevCoinImages, setPrevCoinImages] = useState<(string | undefined)[]>([]);
  const prevCoinImagesRef = useRef<(string | undefined)[]>([]);
  const hasHadCoinsRef = useRef(false);

  useEffect(() => {
    if (visible) {
      // ถ้า modal เพิ่งเปิด ให้ sync ref และ reset flag
      if (!hasHadCoinsRef.current) {
        prevCoinImagesRef.current = [...coinImages];
        hasHadCoinsRef.current = coinImages.some(Boolean);
        setNewCoinIndex(null);
        setShowNewCoinEffect(false);
        return;
      }
      // detect new coin เฉพาะกรณีเคยมี coinImages ที่ไม่ว่างแล้ว
      if (hasHadCoinsRef.current && coinImages.length > 0) {
        const newCoins = coinImages
          .map((img, index) => {
            const hadCoin = prevCoinImagesRef.current[index];
            const hasCoin = !!img;
            return hasCoin && !hadCoin ? index : null;
          })
          .filter((index): index is number => index !== null);
        if (newCoins.length > 0) {
          const latestNewCoin = newCoins[newCoins.length - 1];
          setNewCoinIndex(latestNewCoin);
          setShowNewCoinEffect(true);
        }
      }
      prevCoinImagesRef.current = [...coinImages];
      hasHadCoinsRef.current = coinImages.some(Boolean);
    }
  }, [coinImages, visible]);

  useEffect(() => {
    if (!visible) {
      prevCoinImagesRef.current = [];
      hasHadCoinsRef.current = false;
      setNewCoinIndex(null);
      setShowNewCoinEffect(false);
    }
  }, [visible]);

  // Glow animation control (framer-motion)
  const glowControls = useAnimation();

  const first14 = coinImages.slice(0, 14);
  const isComplete = first14.length === 14 && first14.every(Boolean);

  useEffect(() => {
    if (isComplete && visible) {
      glowControls.start({
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1.8, repeat: Infinity },
      });
      setShowFirework(true);
      const timer = setTimeout(() => setShowFirework(false), 1500);
      return () => clearTimeout(timer);
    } else {
      glowControls.stop();
      glowControls.set({ opacity: 0.7 });
      setShowFirework(false);
    }
  }, [isComplete, visible, glowControls]);

  // New coin animation controls
  const newCoinControls = useAnimation();
  const newCoinScaleControls = useAnimation();
  const newCoinPosition = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (showNewCoinEffect && newCoinIndex !== null) {
      newCoinControls.set({ rotate: 0, opacity: 1 });
      newCoinScaleControls.set({ scale: 0.3 });
      newCoinPosition.current = { x: 0, y: 0 };
      // Animate rotation and scale
      newCoinControls.start({
        rotate: 360,
        transition: { duration: 0.8 },
      });
      newCoinScaleControls.start({
        scale: 1.5,
        transition: { duration: 0.4 },
      });
    }
  }, [showNewCoinEffect, newCoinIndex]);

  const handleTapToPlace = () => {
    if (showNewCoinEffect && newCoinIndex !== null) {
      const { x: targetX, y: targetY } = getCoinPosition(
        newCoinIndex,
        NUM_SQUARES,
        RADIUS,
        KITE_INNER_RADIUS,
        KITE_OUTER_RADIUS,
      );
      // Animate position and scale back to 1
      newCoinPosition.current = { x: targetX, y: targetY };
      newCoinScaleControls.start({ scale: 1, transition: { duration: 0.6 } });
      newCoinControls.start({ rotate: 0, transition: { duration: 0.6 } });
      setTimeout(() => {
        setShowNewCoinEffect(false);
        setNewCoinIndex(null);
      }, 600);
    }
  };

  const { language } = useLanguage();

  // Helper to get translated title
  const getTitle = () => {
    if (currentPage === 0) return i18n.t('guardianCrystals', { lng: language });
    if (currentPage === 1) return i18n.t('specialRewards', { lng: language });
    return '';
  };

  if (!visible) return null;

  return (
    <div
      style={styles.overlay}
      onClick={showNewCoinEffect ? handleTapToPlace : onClose}
    >
      <div
        style={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={styles.title}>{getTitle()}</h2>

        <div style={styles.stampHexGridContainer}>
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
            <motion.div
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
                zIndex: 1,
              }}
              animate={glowControls}
              initial={{ opacity: 0.7 }}
            >
              <svg width={CENTER_X * 2} height={CENTER_Y * 2}>
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={RADIUS + 40}
                  fill="rgba(255,255,120,0.25)"
                />
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={RADIUS + 20}
                  fill="rgba(255,255,200,0.18)"
                />
              </svg>
            </motion.div>
          )}

          {currentPage === 0 && (
            <>
              <svg width={CENTER_X * 2} height={CENTER_Y * 2}>
                <circle cx={CENTER_X} cy={CENTER_Y} r={12} fill="transparent" />
                {[...Array(NUM_SQUARES)].map((_, i) => {
                  const { cx, cy, rotate } = getCoinPosition(i, NUM_SQUARES, RADIUS);
                  return (
                    <g
                      key={i}
                      transform={`rotate(${rotate} ${cx} ${cy})`}
                    >
                      <rect
                        x={cx}
                        y={cy}
                        width={0}
                        height={0}
                        fill="transparent"
                      />
                    </g>
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
                    <g key={`kite-${i}`}>
                      <polygon points="" fill="transparent" />
                      <text
                        x={centroidX}
                        y={centroidY + 6}
                        fontSize={18}
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                      />
                    </g>
                  );
                })}
              </svg>
              {[...Array(14)].map((_, i) => {
                if (!coinImages[i]) return null;
                const { cx, cy } = getCoinPosition(
                  i,
                  NUM_SQUARES,
                  RADIUS,
                  KITE_INNER_RADIUS,
                  KITE_OUTER_RADIUS,
                  CENTER_X,
                  CENTER_Y,
                );
                const rotate = coinRotations[i] ?? 0;
                const size = coinSizes[i] ?? 85;
                const isNew = showNewCoinEffect && newCoinIndex === i;
                // ลบ border และ label debug
                return (
                  <div key={`img-wrap-${i}-${hasModalOpened ? 'open' : 'closed'}`}
                    style={{
                      position: 'absolute',
                      left: cx - size / 2,
                      top: cy - size / 2,
                      width: size,
                      height: size,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    <motion.img
                      key={`img-${i}-${hasModalOpened ? 'open' : 'closed'}`}
                      src={coinImages[i]}
                      alt={`coin-${i}`}
                      initial={isNew ? { scale: 0.3, opacity: 0, rotate: 0 } : { scale: 1, opacity: 0, rotate: `${rotate}deg` }}
                      animate={
                        isNew
                          ? { scale: [0.3, 1.5, 1], opacity: [0, 1, 1], rotate: [0, 360, rotate] }
                          : { scale: 1, opacity: 1, rotate: `${rotate}deg` }
                      }
                      transition={
                        isNew
                          ? { duration: 0.8 }
                          : { delay: i * 0.1, duration: 0.4 }
                      }
                      onAnimationComplete={() => {
                        if (isNew) {
                          setShowNewCoinEffect(false);
                          setNewCoinIndex(null);
                        }
                      }}
                      style={{
                        width: size,
                        height: size,
                        transformOrigin: 'center center',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                      }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {currentPage === 1 && (
            <div style={styles.sponsor2RowsContainer}>
              <div style={styles.sponsorRow2Row}>
                {[0, 1, 2].map((i) => {
                  const idx = 15 + i;
                  return (
                    <div key={idx} style={styles.sponsorStampSlot}>
                      {coinImages[idx] && (
                        <img
                          src={coinImages[idx]}
                          alt={`sponsor-coin-${idx}`}
                          style={styles.sponsorStampImg}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ ...styles.sponsorRow2Row, ...styles.sponsorRow2RowBottomHex }}>
                {[3, 4, 5, 6].map((i) => {
                  const idx = 15 + i;
                  return (
                    <div key={idx} style={styles.sponsorStampSlot}>
                      {coinImages[idx] && (
                        <img
                          src={coinImages[idx]}
                          alt={`sponsor-coin-${idx}`}
                          style={styles.sponsorStampImg}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={styles.dotIndicatorContainer}>
          {[0, 1].map((idx) => (
            <div
              key={idx}
              style={{
                ...styles.dot,
                ...(currentPage === idx ? styles.dotActive : {}),
              }}
            />
          ))}
        </div>

        <div style={styles.pageNavBtnContainer}>
          <button
            style={{
              ...styles.pageNavBtn,
              ...(currentPage === 0 ? styles.pageNavBtnDisabled : {}),
            }}
            onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            ←
          </button>
          <button
            style={{
              ...styles.pageNavBtn,
              ...(currentPage === 1 ? styles.pageNavBtnDisabled : {}),
            }}
            onClick={() => currentPage < 1 && setCurrentPage(currentPage + 1)}
            disabled={currentPage === 1}
            aria-label="Next page"
          >
            →
          </button>
        </div>

        <button style={styles.rewardBtn} onClick={onClose} aria-label="Close modal">
          Close
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    width: 320,
    borderRadius: 28,
    padding: '24px 18px',
    textAlign: 'center',
    position: 'relative',
    color: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    marginTop: 8,
  },
  stampHexGridContainer: {
    width: 300,
    height: 340,
    position: 'relative',
    marginBottom:10
  },
  rewardBtn: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    padding: '10px 32px',
    marginTop: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#888',
  },
  sponsor2RowsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  sponsorRow2Row: {
    display: 'flex',
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
    margin: '0 4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sponsorStampImg: { width: 48, height: 48, objectFit: 'contain' },
  dotIndicatorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: -10,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: '#bbb',
    margin: '0 4px',
    opacity: 0.5,
  },
  dotActive: { backgroundColor: '#fff', opacity: 1 },
  pageNavBtnContainer: {
    display: 'flex',
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
    border: 'none',
    cursor: 'pointer',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  pageNavBtnDisabled: { backgroundColor: '#bbb', opacity: 0.5, cursor: 'default' },
};
