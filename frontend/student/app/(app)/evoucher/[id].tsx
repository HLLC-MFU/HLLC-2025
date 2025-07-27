import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState, useCallback, useMemo } from 'react'
import {
    SafeAreaView, View, Text, StyleSheet, FlatList,
    RefreshControl, TouchableOpacity, TextInput, ActivityIndicator, Platform
} from 'react-native'
import { ArrowLeft, Search } from 'lucide-react-native'
import { useEvoucher } from '@/hooks/useEvoucher'
import { useSponsors } from '@/hooks/useSponsors'
import { EvoucherCodeCard } from '@/components/evoucher/EvoucherCodeCard'
import { EvoucherModal } from '@/components/evoucher/EvoucherModal'
import { IEvoucher, IEvoucherCode } from '@/types/evoucher'
import { YStack } from 'tamagui'
import { t } from 'i18next'
import { SearchInput } from '@/components/global/SearchInput'

export default function SponsorVoucherScreen() {
    const { id: sponsorId } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()

    const [searchQuery, setSearchQuery] = useState('')
    const [refreshing, setRefreshing] = useState(false)
    const [modalState, setModalState] = useState<{
        show: boolean
        evoucher: IEvoucher | null
        evoucherCode: IEvoucherCode | null
    }>({ show: false, evoucher: null, evoucherCode: null })

    const { sponsors, fetchSponsorsWithEvouchers } = useSponsors()
    const {
        fetchEvouchersBySponsor,
        fetchMyEvoucherCodes,
        getEvoucherCodesBySponsor,
    } = useEvoucher()

    const currentSponsor = useMemo(
        () => sponsors.find(s => s._id === sponsorId),
        [sponsorId, sponsors]
    )

    const codes = sponsorId ? getEvoucherCodesBySponsor(sponsorId) : []

    const filteredCodes = codes
        .filter(code =>
            code.evoucher.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
            code.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => Number(a.isUsed) - Number(b.isUsed))

    useEffect(() => {
        if (sponsorId) {
            fetchEvouchersBySponsor(sponsorId)
        }
        fetchMyEvoucherCodes()
        fetchSponsorsWithEvouchers()
    }, [sponsorId])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await Promise.all([
            fetchSponsorsWithEvouchers(),
            fetchMyEvoucherCodes(),
        ])
        setRefreshing(false)
    }, [])

    const handleEvoucherPress = (evoucher: IEvoucher, code: IEvoucherCode) => {
        setModalState({ show: true, evoucher, evoucherCode: code })
    }

    const handleClaimSuccess = async () => {
        await fetchMyEvoucherCodes()
        setModalState({ show: false, evoucher: null, evoucherCode: null })
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <YStack padding="$4" gap="$4" flex={1}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => router.push('/evoucher')} style={styles.backButton}>
                        <ArrowLeft size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {currentSponsor?.name?.en ?? 'Loading...'}
                    </Text>
                </View>

                <SearchInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t('evoucher.searchPlaceholder')}
                />

                <FlatList
                    data={filteredCodes}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    renderItem={({ item }) => (
                        <EvoucherCodeCard
                            key={item._id}
                            imageSource={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${item.evoucher.photo.home || ''}` }}
                            onPress={() => handleEvoucherPress(item.evoucher, item)}
                            isUsed={item.isUsed}
                        />
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchQuery
                                    ? t('evoucher.NoEvoucherFound')
                                    : t('evoucher.NoEvoucherFromSponsor')}
                            </Text>
                        </View>
                    )}
                />
            </YStack>

            {modalState.show && modalState.evoucher && (
                <EvoucherModal
                    isVisible={modalState.show}
                    onClose={() => setModalState({ show: false, evoucher: null, evoucherCode: null })}
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
    )
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Platform.select({ ios: 26, default: 0 }),
    },
    backButton: {
        marginRight: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 15,
        height: 48,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        marginLeft: 10,
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
})
