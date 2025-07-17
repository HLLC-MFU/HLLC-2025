import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, Linking, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { Lang } from '@/types/lang';
import { useTranslation } from 'react-i18next';

interface Marker {
  x: number;
  y: number;
  image: string;
  description: Lang;
  mapsUrl: string;
  _id: string;
}

interface MarkerDetailModalProps {
  visible: boolean;
  marker: Marker | null;
  collectedIds: string[];
  onClose: () => void;
  onCheckIn: () => void;
}

export default function MarkerDetailModal({ 
  visible, 
  marker, 
  collectedIds,
  onClose, 
  onCheckIn 
}: MarkerDetailModalProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const isCollected = marker ? collectedIds.includes(marker._id) : false;

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
                <ScrollView 
                  style={styles.modalTextContainer}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.modalTextContent}
                >
                  <Text style={styles.modalText}>
                    {marker.description?.[language] || marker.description?.th || marker.description?.en || ''}
                  </Text>
                </ScrollView>
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
                    style={[
                      styles.modalButton,
                      isCollected && styles.modalButtonDisabled
                    ]}
                    onPress={() => {
                      if (!isCollected) {
                        onClose();
                        setTimeout(() => {
                          router.push({ pathname: '/qrcode', params: { tab: 'scan' } });
                        }, 200);
                      }
                    }}
                    disabled={isCollected}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons 
                        name={isCollected ? 'check-circle' : "qrcode-scan"} 
                        size={20} 
                        color={isCollected ? 'green' : '#222'} 
                        style={{ marginRight: 6 }} 
                      />
                      <Text style={[
                        styles.modalButtonText, 
                        { color: isCollected ? '#6b7280' : '#333' }
                      ]}>
                        {isCollected ? t('coinHunting.collected') : t('coinHunting.checkInNow')}
                      </Text>
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    width: Math.min(screenWidth * 0.9, 350),
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
    width: Math.min(screenWidth * 0.8, 300),
    height: Math.min(screenWidth * 0.8 * 0.6, 200),
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  modalTextContainer: {
    maxHeight: Math.min(screenHeight * 0.15, 130),
    marginBottom: 18,
  },
  modalTextContent: {
    paddingHorizontal: 8,
  },
  modalText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
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
  modalButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  modalButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 