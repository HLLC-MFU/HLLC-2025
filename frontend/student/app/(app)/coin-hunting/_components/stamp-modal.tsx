import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

interface StampModalProps {
  visible: boolean;
  onClose: () => void;
  stamps?: number; // จำนวน stamp ที่ได้
  onGetReward?: () => void;
}

const HEX_SIZE = 48; // ขนาดของหกเหลี่ยมแต่ละช่อง
const HEX_HEIGHT = HEX_SIZE * Math.sqrt(3);
const STAMP_HEX_POSITIONS = [
  // กำหนดตำแหน่ง (x, y) ของแต่ละช่องใน grid (ต้องปรับให้เหมาะสมกับ layout จริง)
  { x: 2, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  { x: 0, y: 2 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
  { x: 3, y: 2 },
  { x: 4, y: 2 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 3, y: 3 },
  { x: 2, y: 4 },
  { x: 2, y: 5 },
];

function getHexPoints(size: number) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    const x = size + size * Math.cos(angle);
    const y = size + size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

export default function StampModal({ visible, onClose, stamps = 0, onGetReward }: StampModalProps) {
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
            {STAMP_HEX_POSITIONS.map((pos, idx) => (
              <View
                key={idx}
                style={{
                  position: 'absolute',
                  left: pos.x * (HEX_SIZE * 0.88) + 10,
                  top: pos.y * (HEX_HEIGHT * 0.5) + 10,
                }}
              >
                <Svg width={HEX_SIZE * 2} height={HEX_SIZE * 2}>
                  <Polygon
                    points={getHexPoints(HEX_SIZE)}
                    fill={idx < stamps ? '#FFD700' : '#E0E0E0'}
                    stroke="#B0B0B0"
                    strokeWidth={2}
                  />
                </Svg>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.rewardBtn} onPress={onClose} activeOpacity={0.7}>
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