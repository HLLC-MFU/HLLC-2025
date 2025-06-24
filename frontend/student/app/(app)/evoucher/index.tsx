import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Search, ArrowLeft } from 'lucide-react-native';
import { SponsorCard } from '../../../components/evoucher/SponsorCard';
import { EvoucherCodeCard } from '../../../components/evoucher/EvoucherCodeCard';
import { EvoucherModal } from '../../../components/evoucher/EvoucherModal';
import { useSponsors } from '@/hooks/useSponsors';
import { useEvoucher } from '@/hooks/useEvoucher';
import { ISponsor } from '@/types/sponsor';
import { IEvoucher, IEvoucherCode } from '@/types/evoucher';

export default function EvoucherPage() {
  // รวม modalState
  const [modalState, setModalState] = useState<{
    show: boolean;
    evoucher: IEvoucher | null;
    evoucherCode: IEvoucherCode | null;
  }>({ show: false, evoucher: null, evoucherCode: null });

  // ใช้ currentSponsorId แทน showMyCodes
  const [currentSponsorId, setCurrentSponsorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter sponsors based on search query and isShow status
  const filteredSponsors = sponsors.filter(
    sponsor =>
      sponsor.isShow &&
      (sponsor.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sponsor.name.th.toLowerCase().includes(searchQuery.toLowerCase())),
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
  const displayTitle = currentSponsor ? currentSponsor.name.en : 'E-Voucher';

  // Loading state
  if (sponsorsLoading && sponsors.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
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
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container}>
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentSponsorId ? (
          <View style={styles.evoucherGrid}>
            {evouchersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Loading evouchers...</Text>
              </View>
            ) : filteredMyCodesForCurrentSponsor.length > 0 ? (
              <>
                {filteredMyCodesForCurrentSponsor.map((evoucherCode: IEvoucherCode) => (
                  <EvoucherCodeCard
                    key={evoucherCode._id}
                    imageSource={{
                      uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${
                        evoucherCode.evoucher.photo.evoucherImage ||
                        evoucherCode.evoucher.photo.coverPhoto
                      }`,
                    }}
                    onPress={() =>
                      handleEvoucherCodePress(
                        evoucherCode.evoucher,
                        evoucherCode,
                      )
                    }
                    isUsed={evoucherCode.isUsed}
                    code={evoucherCode.code}
                  />
                ))}
              </>
            ) : filteredEvouchers.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Available Evouchers</Text>
                </View>
                {filteredEvouchers.map((evoucher: IEvoucher) => (
                  <EvoucherCodeCard
                    key={evoucher._id}
                    imageSource={{
                      uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${
                        evoucher.photo.evoucherImage ||
                        evoucher.photo.coverPhoto
                      }`,
                    }}
                    onPress={() => handleEvoucherCodePress(evoucher)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'No evouchers found matching your search.'
                    : 'No evouchers available for this sponsor.'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.sponsorGrid}>
            {filteredSponsors.length > 0 ? (
              filteredSponsors.map((sponsor: ISponsor) => (
                <SponsorCard
                  key={sponsor._id}
                  imageSource={{
                    uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${sponsor.photo.logoPhoto}`,
                  }}
                  onPress={() => handleSponsorCardPress(sponsor._id)}
                  hasEvoucherCodes={hasEvoucherCodesForSponsor(sponsor._id)}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'No sponsors found matching your search.'
                    : 'No sponsors available.'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {modalState.show && modalState.evoucher && (
        <EvoucherModal
          isVisible={modalState.show}
          onClose={handleCloseModal}
          evoucherImageFront={{
            uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${
              modalState.evoucher.photo.evoucherImageFront ||
              modalState.evoucher.photo.coverPhoto
            }`,
          }}
          evoucherImageBack={{
            uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${
              modalState.evoucher.photo.evoucherImageBack ||
              modalState.evoucher.photo.bannerPhoto ||
              modalState.evoucher.photo.coverPhoto
            }`,
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'left',
    paddingLeft: 20,
  },
  headerTitlePadded: {
    paddingStart: 20,
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
    marginLeft: 10,
    marginRight: 10,
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
