import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import useCoinHunting from '@/hooks/useCoinHunting';
import { BlurView } from 'expo-blur';
import { ImagePreviewModal } from '@/components/chats/ImagePreviewModal';
import { useFocusEffect } from '@react-navigation/native';
import { apiRequest } from '@/utils/api';

export default function MarkerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [localIsCollected, setLocalIsCollected] = useState(false);
  const {
    markers,
    collectedIds,
    loadingMarkers,
  } = useCoinHunting();

  const marker = markers.find((m) => m._id === id);
  // Use local state if available, otherwise fall back to global state
  const isCollected = localIsCollected || (marker ? collectedIds.includes(marker._id) : false);
  

  // Light refresh only when returning from QR scanner
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we just came back from QR scanner (check if we have a recent scan)
      const refreshOnFocus = async () => {
        try {
          const response = await apiRequest('/coin-collections/my-coin', 'GET');
          if (response && (response as any).data && Array.isArray((response as any).data.data)) {
            const allLandmarks = (response as any).data.data.flatMap((c: any) => c.landmarks || []);
            const freshCollectedIds = allLandmarks.map((l: any) => l.landmark?._id).filter(Boolean) as string[];
            const isFreshCollected = freshCollectedIds.includes(id as string);
            setLocalIsCollected(isFreshCollected);
          }
        } catch (error) {
          // Silent fail - keep current state
        }
      };
      refreshOnFocus();
    }, [id])
  );

  if (loadingMarkers) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#fff' }}>{t('coinHunting.loading') || 'Loading...'}</Text>
      </View>
    );
  }
  if (!marker) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#fff' }}>{t('coinHunting.notFound') || 'Marker not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: '#fff', fontSize: 28 }}>←</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Full image with rounded bottom */}
      <View style={styles.imageWrapper}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => setShowImagePreview(true)}
          style={{ width: '100%', height: '100%' }}
        >
          <Image source={{ uri: marker.image }} style={styles.fullImage} />
        </TouchableOpacity>
        
        {/* Floating back button */}
        <TouchableOpacity onPress={() => router.replace('/community/coin-hunting')} style={styles.backButton}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="dark" style={styles.backButtonBlur}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
            </BlurView>
          ) : (
            <View style={styles.backButtonAndroid}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.actionOverlay}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="dark" style={styles.actionButton}>
              <MaterialCommunityIcons
                name={isCollected ? 'check-circle' : 'qrcode-scan'}
                size={18}
                color={isCollected ? 'green' : '#FFD700'}
              />
              <Text style={styles.actionText}>
                {isCollected ? t('coinHunting.collected') : t('coinHunting.notCheckedIn')}
              </Text>
            </BlurView>
          ) : (
            <View style={styles.actionButtonAndroid}>
              <MaterialCommunityIcons
                name={isCollected ? 'check-circle' : 'qrcode-scan'}
                size={18}
                color={isCollected ? 'green' : '#FFD700'}
              />
              <Text style={styles.actionText}>
                {isCollected ? t('coinHunting.collected') : t('coinHunting.notCheckedIn')}
              </Text>
            </View>
          )}
        </View>
        
        {/* Title and subtitle overlay on image */}
        <View style={styles.titleOverlay}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={50} tint="dark" style={styles.titleBackground}>
              <Text style={styles.title}>{marker.name?.[language]}</Text>
            </BlurView>
          ) : (
            <View style={styles.titleBackgroundAndroid}>
              <Text style={styles.title}>{marker.name?.[language]}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Bottom sheet with details */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={60} tint="dark" style={styles.bottomSheet}>
          <Text style={styles.sectionLabel}>{t('coinHunting.description')}</Text>
          <ScrollView style={{ maxHeight: 200 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
            <Text style={styles.detailText}>
              {marker.description?.[language] || marker.description?.th || marker.description?.en || ''}
            </Text>
          </ScrollView>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => Linking.openURL(marker.mapsUrl)}
            >
              <BlurView intensity={80} tint="light" style={styles.modalButtonBlur}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image 
                    source={require('@/assets/images/google.png')} 
                    style={{ width: 20, height: 20, marginRight: 6, resizeMode: 'contain' }} 
                  />
                  <Text style={styles.modalButtonText}>Google Maps</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                isCollected && styles.modalButtonDisabled
              ]}
              onPress={() => {
                if (!isCollected) {
                  router.push(`/qrcode?tab=scan&t=${Date.now()}`);
                }
              }}
              disabled={isCollected}
            >
              <BlurView intensity={80} tint="light" style={styles.modalButtonBlur}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons 
                    name={isCollected ? 'check-circle' : "qrcode-scan"} 
                    size={20} 
                    color={isCollected ? 'green' : '#fff'} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[
                    styles.modalButtonText, 
                    { color: isCollected ? '#fff' : '#fff' }
                  ]}>
                    {isCollected ? t('coinHunting.collected') : t('coinHunting.checkInNow')}
                  </Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          </View>
        </BlurView>
      ) : (
        <View style={styles.bottomSheetAndroid}>
          <Text style={styles.sectionLabel}>{t('coinHunting.description')}</Text>
          <ScrollView style={{ maxHeight: 200 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
            <Text style={styles.detailText}>
              {marker.description?.[language] || marker.description?.th || marker.description?.en || ''}
            </Text>
          </ScrollView>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => Linking.openURL(marker.mapsUrl)}
            >
              <View style={styles.modalButtonAndroid}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image 
                    source={require('@/assets/images/google.png')} 
                    style={{ width: 20, height: 20, marginRight: 6, resizeMode: 'contain' }} 
                  />
                  <Text style={[styles.modalButtonText, { color: '#222' }]}>Google Maps</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                isCollected && styles.modalButtonDisabled
              ]}
              onPress={() => {
                if (!isCollected) {
                  router.push(`/qrcode?tab=scan&t=${Date.now()}`);
                }
              }}
              disabled={isCollected}
            >
              <View style={styles.modalButtonAndroid}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons 
                    name={isCollected ? 'check-circle' : "qrcode-scan"} 
                    size={20} 
                    color={isCollected ? 'green' : '#222'} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[
                    styles.modalButtonText, 
                    { color: isCollected ? '#6b7280' : '#222' }
                  ]}>
                    {isCollected ? t('coinHunting.collected') : t('coinHunting.checkInNow')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={showImagePreview}
        imageUrl={marker.image}
        onClose={() => setShowImagePreview(false)}
      />
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageWrapper: {
    width: '100%',
    height: screenHeight * 0.58,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#222',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 44,
    left: 18,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    borderRadius: 20,
    padding: 8,
  },
  backButtonAndroid: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 8,
  },
  actionOverlay: {
    position: 'absolute',
    top: 44,
    right: 18,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
    overflow: 'hidden',
  },
  actionButtonAndroid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 5,
  },
  titleBackground: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  titleBackgroundAndroid: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  bottomSheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -32,
    paddingTop: 32,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  bottomSheetAndroid: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.97)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -32,
    paddingTop: 32,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 18,
  },
  modalButton: {
    borderRadius: 8,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  modalButtonBlur: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  modalButtonAndroid: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonDisabled: {
    opacity: 0.75,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fullScreenIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 5,
  },
}); 