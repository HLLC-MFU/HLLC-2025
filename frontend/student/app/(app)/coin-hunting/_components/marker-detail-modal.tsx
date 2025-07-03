import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Marker {
  x: number;
  y: number;
  image: string;
  description: string;
  mapsUrl: string;
}

interface MarkerDetailModalProps {
  visible: boolean;
  marker: Marker | null;
  onClose: () => void;
  onCheckIn: () => void;
}

export default function MarkerDetailModal({ 
  visible, 
  marker, 
  onClose, 
  onCheckIn 
}: MarkerDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentWrapper}>
          <BlurView intensity={40} tint="dark" style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={onClose}
            >
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>×</Text>
            </TouchableOpacity>
            {marker && (
              <>
                <Image
                  source={{ uri: marker.image }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalText}>
                  {marker.description}
                </Text>
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => Linking.openURL(marker.mapsUrl)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image 
                        source={require('@/assets/images/google.png')} 
                        style={{ width: 20, height: 20, marginRight: 6, resizeMode: 'contain' }} 
                      />
                      <Text style={styles.modalButtonText}>Google Maps</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton]}
                    onPress={onCheckIn}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons 
                        name="qrcode-scan" 
                        size={20} 
                        color="#222" 
                        style={{ marginRight: 6 }} 
                      />
                      <Text style={[styles.modalButtonText, { color: '#333' }]}>Check in Now</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modalContent: {
    width: 320,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: 260,
    height: 140,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  modalText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 2,
  },
  modalButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 