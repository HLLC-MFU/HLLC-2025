import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Rect, Circle, G, Polygon, Text as SvgText } from 'react-native-svg';

interface StampModalProps {
  visible: boolean;
  onClose: () => void;
  stamps?: number; // จำนวน stamp ที่ได้
  onGetReward?: () => void;
  coinImages?: string[]; // <-- add this prop
}

const NUM_SQUARES = 7;
const RADIUS = 90;
const SQUARE_SIZE = 60;
const CENTER_X = 140;
const CENTER_Y = 160;

export default function StampModal({
  visible,
  onClose,
  stamps = 0,
  onGetReward,
  coinImages = [], // <-- default empty array
}: StampModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Collection</Text>
          <View style={styles.stampHexGridContainer}>
            <Svg width={CENTER_X * 2} height={CENTER_Y * 2}>
              {/* วงกลมตรงกลาง */}
              <Circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={12}
                fill="transparent"
                stroke="#fff"
                strokeWidth={2}
              />
              {/* สี่เหลี่ยมรอบนอก */}
              {[...Array(NUM_SQUARES)].map((_, i) => {
                const angle = (2 * Math.PI * i) / NUM_SQUARES;
                const cx = CENTER_X + RADIUS * Math.cos(angle);
                const cy = CENTER_Y + RADIUS * Math.sin(angle);
                const rotate = (angle * 180) / Math.PI + 45;
                return (
                  <G key={i} origin={`${cx},${cy}`} rotation={rotate}>
                    <Rect
                      x={cx - SQUARE_SIZE / 2}
                      y={cy - SQUARE_SIZE / 2}
                      width={SQUARE_SIZE}
                      height={SQUARE_SIZE}
                      fill={coinImages[i] ? 'transparent' : 'gray'}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                    {/* Order number label */}
                    <SvgText
                      x={cx + SQUARE_SIZE / 2 - 14}
                      y={cy - SQUARE_SIZE / 2 + 20}
                      fontSize={18}
                      fontWeight="bold"
                      fill="#fff"
                      textAnchor="end"
                      alignmentBaseline="hanging"
                      stroke="#222"
                      strokeWidth={0.5}
                    >
                      {i + 1}
                    </SvgText>
                    {coinImages[i] && (
                      <Image
                        source={{ uri: coinImages[i] }}
                        style={{
                          position: 'absolute',
                          left: cx - SQUARE_SIZE / 2 + 2,
                          top: cy - SQUARE_SIZE / 2 + 2,
                          width: SQUARE_SIZE - 4,
                          height: SQUARE_SIZE - 4,
                          borderRadius: 8,
                          resizeMode: 'contain',
                        }}
                      />
                    )}
                  </G>
                );
              })}
              {/* diamond/kite 7 อันแทรกในช่องว่างระหว่างสี่เหลี่ยม (polygon 4 จุด) */}
              {[...Array(NUM_SQUARES)].map((_, i) => {
                // 1. จุดที่ขอบวงกลมตรงกลาง (ปลายแหลมใน)
                const angleMid = (2 * Math.PI * (i + 1)) / NUM_SQUARES;
                const innerRadius = 12; // << ปรับรัศมีวงกลมตรงกลาง
                const p1 = {
                  x: CENTER_X + innerRadius * Math.cos(angleMid),
                  y: CENTER_Y + innerRadius * Math.sin(angleMid),
                };

                // 2. จุดขอบด้านในของสี่เหลี่ยม i (ปลายด้านใน)
                const angleIn1 = (2 * Math.PI * i) / NUM_SQUARES + Math.PI / 3.5;
                const inRadius = RADIUS - (SQUARE_SIZE / 2) * Math.SQRT2; // << ปรับความยาวขา diamond
                const p2 = {
                  x: CENTER_X + inRadius * Math.cos(angleIn1),
                  y: CENTER_Y + inRadius * Math.sin(angleIn1),
                };

                // 3. จุดที่มุมของสี่เหลี่ยมสองอันด้านนอกมาชนกัน (ปลายด้านนอก)
                const angleOut =
                  (2 * Math.PI * (i + 1)) / NUM_SQUARES - Math.PI / NUM_SQUARES;
                const outRadius = RADIUS + SQUARE_SIZE / 7; // << ปรับรัศมีจุดปลายด้านนอก
                const p3 = {
                  x: CENTER_X + outRadius * Math.cos(angleOut),
                  y: CENTER_Y + outRadius * Math.sin(angleOut),
                };

                // 4. จุดขอบด้านในของสี่เหลี่ยม i+1 (ปลายด้านใน)
                const angleIn2 =
                  (2 * Math.PI * (i + 0.9)) / NUM_SQUARES - Math.PI / 4;
                const p4 = {
                  x: CENTER_X + inRadius * Math.cos(angleIn2),
                  y: CENTER_Y + inRadius * Math.sin(angleIn2),
                };

                // 4. จุดขอบด้านในของสี่เหลี่ยม i+1 (ปลายด้านใน)
                const angleOut1 = (2 * Math.PI * (i + 1)) / NUM_SQUARES - Math.PI / NUM_SQUARES;
                const p5 = {
                  x: CENTER_X + outRadius * Math.cos(angleOut1),
                  y: CENTER_Y + outRadius * Math.sin(angleOut1),
                };

                const angleMid1 = (2 * Math.PI * (i + 0)) / NUM_SQUARES;
                const p6 = {
                  x: CENTER_X + innerRadius * Math.cos(angleMid1),
                  y: CENTER_Y + innerRadius * Math.sin(angleMid1),
                };

                // Calculate centroid for label
                const centroidX = (p1.x + p2.x + p3.x + p4.x + p6.x) / 5;
                const centroidY = (p1.y + p2.y + p3.y + p4.y + p6.y) / 5;

                return (
                  <G key={`kite-group-${i}`}>
                    <Polygon
                      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p6.x},${p6.y}`}
                      fill="gray"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                    {/* Order number for inner diamond: 8-14 */}
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
                      {i + 8}
                    </SvgText>
                    {coinImages[i + 7] && (
                      <Image
                        source={{ uri: coinImages[i + 7] }}
                        style={{
                          position: 'absolute',
                          left: centroidX - (SQUARE_SIZE - 4) / 2,
                          top: centroidY - (SQUARE_SIZE - 4) / 2,
                          width: SQUARE_SIZE - 4,
                          height: SQUARE_SIZE - 4,
                          borderRadius: 8,
                          resizeMode: 'contain',
                        }}
                      />
                    )}
                  </G>
                );
              })}
            </Svg>
          </View>
          <TouchableOpacity
            style={styles.rewardBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.rewardBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10,
    padding: 8,
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
    width: 280,
    height: 320,
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
