import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Alert, ImageSourcePropType } from 'react-native';
import { FlipCard } from './FlipCard'; // import ตัว premium component ที่เพิ่งสร้าง
import { GlassButton } from '@/components/ui/GlassButton';
import { t } from 'i18next';
import { apiRequest } from '@/utils/api';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { useToastController } from '@tamagui/toast';
import { GlassLiquidButton } from '@/components/ui/GlassLiquidButton';
import * as SecureStore from 'expo-secure-store';
import { BlurView } from 'expo-blur';
import GlassConfirmModal from './GlassConfirmModal';
import { useEvoucher } from '@/hooks/useEvoucher';


const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 400;

interface EvoucherModalProps {
    isVisible: boolean;
    onClose: () => void;
    evoucherImageFront: ImageSourcePropType;
    evoucherImageBack: ImageSourcePropType;
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const toast = useToastController();
    const { useVoucherCode } = useEvoucher();

    const handleUseVoucher = async () => {
        if (!evoucherCodeId) {
            toast.show('เกิดข้อผิดพลาด', { message: 'No evoucher code ID provided', type: 'error' });
            return;
        }
        setIsLoading(true);
        await useVoucherCode(
            evoucherCodeId,
            () => {
                setIsUsed(true);
                toast.show('แลกรับ E-Voucher สำเร็จ', { message: 'Evoucher code claimed successfully!', type: 'success' });
                onClaimSuccess?.();
                setIsLoading(false);
            },
            (msg: string) => {
                toast.show('เกิดข้อผิดพลาด', { message: msg || 'Failed to claim evoucher code', type: 'error' });
                setIsLoading(false);
            }
        );
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
                                            <Image  source={require('@/assets/images/logo-sdad.png')} style={styles.coverImage}/>
                                            </View>
                                            <Text style={styles.usedText}>Used</Text>
                                        </View>
                                    ) : (
                                        // แสดงปุ่ม Use เมื่อยังไม่ถูกใช้
                                        <GlassLiquidButton onPress={() => setShowConfirmModal(true)} disabled={isLoading}>
                                            {isLoading ? 'Claiming...' : 'Use'}
                                        </GlassLiquidButton>
                                    )}
                                </View>
                            </View>
                        }
                    />
                    <Text style={styles.flipText}>Click Voucher to Flip</Text>
                </View>
            </View>

            {/* Custom Confirm Modal */}
            <GlassConfirmModal
                visible={showConfirmModal}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={async () => {
                    setShowConfirmModal(false);
                    await handleUseVoucher();
                }}
                isLoading={isLoading}
                title="ยืนยันการใช้ E-Voucher"
                message="คุณแน่ใจหรือไม่ว่าต้องการใช้ E-Voucher นี้?"
                confirmText="ยืนยัน"
                cancelText="ยกเลิก"
            />
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
    flipText: {
        color: '#fff', marginTop: 15
    },
    coverImage:{
        width: 50,
        height: 50,
        resizeMode: 'cover',
        marginBottom: -20
    },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmContainer: {
        borderRadius: 16,
        padding: 24,
        width: 300,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#222',
    },
    confirmMessage: {
        fontSize: 15,
        color: '#444',
        marginBottom: 24,
        textAlign: 'center',
    },
    confirmButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#eee',
    },
    confirmButtonActive: {
        backgroundColor: '#4caf50',
    },
    cancelButtonText: {
        color: '#888',
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default EvoucherModal;
