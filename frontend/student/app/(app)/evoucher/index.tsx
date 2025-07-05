import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Search, ArrowLeft } from 'lucide-react-native';
import { SponsorCard } from '../../../components/evoucher/SponsorCard';
import { EvoucherCodeCard } from '../../../components/evoucher/EvoucherCodeCard';
import { EvoucherModal } from '../../../components/evoucher/EvoucherModal';
import { useSponsors } from '@/hooks/useSponsors';
import { useEvoucher } from '@/hooks/useEvoucher';
import { IEvoucher, IEvoucherCode } from '@/types/evoucher';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';

export default function EvoucherScreen() {
  // รวม modalState
  const [modalState, setModalState] = useState<{
    show: boolean;
    evoucher: IEvoucher | null;
    evoucherCode: IEvoucherCode | null;
  }>({ show: false, evoucher: null, evoucherCode: null });

  // ใช้ currentSponsorId แทน showMyCodes
  const [currentSponsorId, setCurrentSponsorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  // Custom hooks
  const {
    sponsors,
    loading: sponsorsLoading,
    error: sponsorsError,
    fetchSponsorsWithEvouchers,
  } = useSponsors();
  const {
    evouchers,
    loading: evouchersLoading,
    fetchEvouchersBySponsor,
    fetchMyEvoucherCodes,
    getEvoucherCodesBySponsor,
    hasEvoucherCodesForSponsor,
  } = useEvoucher();

  // Load sponsors and my evoucher codes on component mount
  useEffect(() => {
    fetchSponsorsWithEvouchers();
    fetchMyEvoucherCodes();
  }, []);

  // Load evouchers when sponsor is selected
  useEffect(() => {
    if (currentSponsorId) {
      fetchEvouchersBySponsor(currentSponsorId);
    }
  }, [currentSponsorId]);

  const handleSponsorCardPress = (sponsorId: string) => {
    setCurrentSponsorId(sponsorId);
  };

  const handleEvoucherCodePress = (
    evoucher: IEvoucher,
    evoucherCode?: IEvoucherCode,
  ) => {
    setModalState({
      show: true,
      evoucher,
      evoucherCode: evoucherCode || null,
    });
  };

  const handleCloseModal = () => {
    setModalState({ show: false, evoucher: null, evoucherCode: null });
  };

  const handleClaimSuccess = async () => {
    await fetchMyEvoucherCodes();
    handleCloseModal();
  };

  const handleBackPress = () => {
    setCurrentSponsorId(null);
  };

  // Filter sponsors based on search query
  const filteredSponsors = sponsors.filter(
    sponsor =>
      sponsor.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsor.name.th.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter evouchers based on search query
  const filteredEvouchers = evouchers.filter(
    evoucher =>
      evoucher.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evoucher.detail.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evoucher.detail.th.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter myCodesForCurrentSponsor ตาม searchQuery
  const filteredMyCodesForCurrentSponsor = currentSponsorId
    ? getEvoucherCodesBySponsor(currentSponsorId)
      .filter(code =>
        code.evoucher.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => Number(a.isUsed) - Number(b.isUsed))
    : [];

  const currentSponsor = sponsors.find(
    sponsor => sponsor._id === currentSponsorId,
  );
  const displayTitle = currentSponsor ? currentSponsor.name.en : t('evoucher.title');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSponsorsWithEvouchers(),
      fetchMyEvoucherCodes(),
    ]);
    setRefreshing(false);
  }, [fetchSponsorsWithEvouchers, fetchMyEvoucherCodes]);

  // Loading state
  if (sponsorsLoading && sponsors.length === 0) {
    return (
      <SafeAreaView style={{flex:1}}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading sponsors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (sponsorsError && sponsors.length === 0) {
    return (
      <SafeAreaView style={{flex:1}}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {sponsorsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchSponsorsWithEvouchers}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack padding="$4" gap="$4">
        <View style={styles.headerContainer}>
          {currentSponsorId && (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <Text
            style={[
              styles.headerTitle,
              !currentSponsorId && styles.headerTitlePadded,
            ]}
          >
            {displayTitle}
          </Text>
          {currentSponsorId && <View style={styles.placeholder} />}
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              currentSponsorId ? 'Search Voucher...' : 'Search Sponsor...'
            }
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Show sponsors when no sponsor is selected */}
        {!currentSponsorId && (
          <FlatList
            data={filteredSponsors}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
            contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
            renderItem={({ item }) => (
              <SponsorCard
                key={item._id}
                imageSource={{
                  uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${item.photo.logoPhoto || ''}`,
                }}
                title={item.name.en}
                onPress={() => handleSponsorCardPress(item._id)}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'No sponsors found matching your search.'
                    : 'No sponsors available.'}
                </Text>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
              />
            }
          />
        )}
        {/* Show evoucher/myCodes when sponsor is selected */}
        {currentSponsorId && (
          <FlatList
            data={filteredMyCodesForCurrentSponsor}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => (
              <EvoucherCodeCard
                key={item._id}
                imageSource={{
                  uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${item.evoucher.photo.home || ''}`,
                }}
                onPress={() => handleEvoucherCodePress(item.evoucher, item)}
                code={item.code}
                isUsed={item.isUsed}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  ยังไม่มี evoucher ที่คุณ claim จาก sponsor นี้
                </Text>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
              />
            }
          />
        )}

      </YStack>
      {modalState.show && modalState.evoucher && (
        <EvoucherModal
          isVisible={modalState.show}
          onClose={handleCloseModal}
          evoucherImageFront={{
            uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${modalState.evoucher.photo.front || ''}`,
          }}
          evoucherImageBack={{
            uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${modalState.evoucher.photo.back || ''}`,
          }}
          evoucherCodeId={modalState.evoucherCode?._id}
          onClaimSuccess={handleClaimSuccess}
          isUsed={modalState.evoucherCode?.isUsed}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
  },
  headerTitlePadded: {
    textAlign: 'left',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  sponsorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  evoucherGrid: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  sectionHeader: {
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});
