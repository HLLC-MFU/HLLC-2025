import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { SponsorCard } from '../../../components/evoucher/SponsorCard';
import { useSponsors } from '@/hooks/useSponsors';
import { useEvoucher } from '@/hooks/useEvoucher';
import { useTranslation } from 'react-i18next';
import { XStack, YStack } from 'tamagui';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { SearchInput } from '@/components/global/SearchInput';

export default function EvoucherScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { t } = useTranslation()

  const {
    sponsors,
    loading: sponsorsLoading,
    error: sponsorsError,
    fetchSponsorsWithEvouchers,
  } = useSponsors()
  const { fetchMyEvoucherCodes, getEvoucherCodesBySponsor } = useEvoucher()

  useEffect(() => {
    fetchSponsorsWithEvouchers()
    fetchMyEvoucherCodes()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchSponsorsWithEvouchers();
      fetchMyEvoucherCodes();
    }, [fetchSponsorsWithEvouchers, fetchMyEvoucherCodes])
  );

  const handleSponsorCardPress = (sponsorId: string) => {
    router.push(`/evoucher/${sponsorId}`)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      fetchSponsorsWithEvouchers(),
      fetchMyEvoucherCodes(),
    ])
    setRefreshing(false)
  }, [fetchSponsorsWithEvouchers, fetchMyEvoucherCodes])

  const filteredSponsors = sponsors
    .filter(
      sponsor =>
        sponsor.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sponsor.name.th.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // เรียงตาม sponsor.type.priority ก่อน, ถ้าเท่ากันให้เรียงตาม sponsor.priority
      const aTypePriority = a.type && typeof a.type.priority === 'number' ? a.type.priority : 99;
      const bTypePriority = b.type && typeof b.type.priority === 'number' ? b.type.priority : 99;
      if (aTypePriority !== bTypePriority) {
        return aTypePriority - bTypePriority;
      }
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return 0;
    });

  if (sponsorsLoading && sponsors.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading sponsors...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (sponsorsError && sponsors.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
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
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack 
        padding="$4" 
        gap="$4" 
        flex={1}
        paddingTop={Platform.OS === 'android' ? '$0' : '$4'}
      >
        <Text style={styles.headerTitle}>{t('evoucher.title')}</Text>

        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('evoucher.searchPlaceholder')}
        />

        <FlatList
          data={filteredSponsors}
          keyExtractor={item => item._id}
          numColumns={2}
          style={{ width: '100%', height: '100%' }}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 60 : 30, paddingTop: 10 }}
          renderItem={({ item }) => {
            const evoucherCodes = getEvoucherCodesBySponsor(item._id);
            const unusedCount = evoucherCodes.filter(code => code.isUsed === false).length;
            return (
              <SponsorCard
                key={item._id}
                imageSource={{
                  uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${item.photo.logoPhoto || ''}`,
                }}
                title={item.name.en}
                onPress={() => handleSponsorCardPress(item._id)}
                evoucherCount={unusedCount}
              />
            );
          }}
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        />
      </YStack>
    </SafeAreaView>
  )
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
    marginTop: Platform.select({ ios: 16, default: 0 }),
    marginBottom: Platform.select({ ios: 0, default: -10 }),
  },
  headerTitlePadded: {
    textAlign: 'left',
  },
  backButton: {
    padding: 2,
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
