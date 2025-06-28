import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface StampModalProps {
  visible: boolean;
  onClose: () => void;
  stamps?: number; // จำนวน stamp ที่ได้
  onGetReward?: () => void;
}

const STAMP_LAYOUT = [5, 4, 5]; // จำนวนวงในแต่ละแถว

export default function StampModal({ visible, onClose, stamps = 0, onGetReward }: StampModalProps) {
  let stampIndex = 0;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Collection</Text>
          <View style={styles.stampGrid}>
            {STAMP_LAYOUT.map((count, rowIdx) => (
              <View key={rowIdx} style={styles.stampRow}>
                {Array.from({ length: count }).map((_, col) => {
                  const idx = stampIndex++;
                  return (
                    <View key={col} style={styles.stampCircleWrapper}>
                      {idx < stamps ? (
                        <Image source={require('@/assets/images/logo-sdad.png')} style={styles.stampIcon} />
                      ) : (
                        <View style={styles.stampCircle} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.rewardBtn} onPress={onGetReward} activeOpacity={0.7}>
            <Text style={styles.rewardBtnText}>Get Reward</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: '#AFAFAF',
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
  stampGrid: {
    marginBottom: 24,
  },
  stampRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stampCircleWrapper: {
    width: 44,
    height: 44,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    opacity: 1,
  },
  stampIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
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