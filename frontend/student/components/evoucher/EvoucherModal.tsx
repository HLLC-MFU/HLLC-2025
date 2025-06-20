import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { FlipCard } from './FlipCard'; // import ตัว premium component ที่เพิ่งสร้าง
import { GlassButton } from '@/components/ui/GlassButton';
import { t } from 'i18next';
import { apiRequest } from '@/utils/api';
import { CheckCircle, XCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 400;

interface EvoucherModalProps {
    isVisible: boolean;
    onClose: () => void;
    evoucherImageFront: any;
    evoucherImageBack: any;
    evoucherCodeId?: string; // ID ของ evoucher code ที่จะ claim
    onClaimSuccess?: () => void; // Callback เมื่อ claim สำเร็จ
    isUsed?: boolean; // เพิ่ม prop เพื่อรับสถานะ used จาก parent
}

export const EvoucherModal = ({ 
    isVisible, 
    onClose, 
    evoucherImageFront, 
    evoucherImageBack,
    evoucherCodeId,
    onClaimSuccess,
    isUsed: initialIsUsed = false
}: EvoucherModalProps) => {
    const [isUsed, setIsUsed] = useState(initialIsUsed);
    const [isLoading, setIsLoading] = useState(false);

    const handleUseVoucher = async () => {
        if (!evoucherCodeId) {
            Alert.alert('Error', 'No evoucher code ID provided');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiRequest(`/evoucher-code/use/${evoucherCodeId}`, 'POST', {});
            
            if (response.statusCode === 200 || response.statusCode === 201) {
                setIsUsed(true);
                Alert.alert('Success', 'Evoucher code claimed successfully!');
                onClaimSuccess?.();
            } else {
                Alert.alert('Error', response.message || 'Failed to claim evoucher code');
            }
        } catch (error) {
            console.error('Error claiming evoucher code:', error);
            Alert.alert('Error', 'Failed to claim evoucher code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal transparent={true} visible={isVisible} onRequestClose={onClose} animationType="fade">
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={onClose} />
                <View style={styles.cardContainer}>

                    <FlipCard
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT}
                        front={
                            <Image source={evoucherImageFront} style={styles.cardImage} />
                        }
                        back={
                            <View style={styles.backContentContainer}>
                                <Image source={evoucherImageBack} style={styles.cardImage} />
                                <View style={styles.backOverlay}>
                                    {isUsed ? (
                                        // แสดงเมื่อ evoucher ถูกใช้แล้ว
                                        <View style={styles.usedContainer}>
                                            <View style={styles.usedIconContainer}>
                                            <Image  source={require('@/assets/images/SD.png')} style={styles.coverImage}/>
                                            </View>
                                            <Text style={styles.usedText}>Used</Text>
                                        </View>
                                    ) : (
                                        // แสดงปุ่ม Use เมื่อยังไม่ถูกใช้
                                        <TouchableOpacity 
                                            onPress={handleUseVoucher} 
                                            disabled={isLoading}
                                        >
                                            <GlassButton> 
                                                <Text
                                                    style={{
                                                        color: 'white',
                                                        fontWeight: '600',
                                                        fontSize: 12,
                                                        marginLeft: 0,
                                                    }}
                                                >
                                                    {isLoading ? 'Claiming...' : 'Use'}
                                                </Text>
                                            </GlassButton>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        }
                    />
                    <Text style={styles.flipText}>Click Voucher to Flip</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalBackground: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    },
    cardContainer: {
        justifyContent: 'center', alignItems: 'center',
    },
    cardImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    backContentContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
    },
    backOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        bottom: 30,
    },
    usedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    usedIconContainer: {
        borderRadius: 25,
        padding: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    usedText: {
        color: '#d8cfcd',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
        marginBottom: -10 
    },
    useButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginBottom: 10,
    },
    useButtonText: {
        color: '#fff', fontSize: 12, fontWeight: 'bold',
    },
    flipText: {
        color: '#fff', marginTop: 15
    },
    coverImage:{
        width: 50,
        height: 50,
        resizeMode: 'cover',
        marginBottom: -20
    }
});
