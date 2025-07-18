import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User } from 'lucide-react-native';
import { useAppearance } from '@/hooks/useAppearance';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProgressBar({
    avatarUrl = '',
    onClickAvatar,
}: {
    avatarUrl?: string;
    onClickAvatar?: () => void;
}) {
    const navigation = useNavigation();
    const [imageError, setImageError] = useState(false);
    const { width } = useWindowDimensions();
    const { assets, colors } = useAppearance();
    const imageUrl = `${process.env.EXPO_PUBLIC_API_URL}/uploads/${assets?.profile}`;
    useEffect(() => {
        setImageError(false);
    }, [assets?.profile]);

    return (
        <View style={[styles.container, { maxWidth: width - 64 }]}>
            {/* Avatar */}
            <TouchableOpacity
                style={styles.avatarButton}
                onPress={onClickAvatar ?? (() => navigation.navigate('Profile' as never))}
            >

                {!imageError ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.avatar}
                        onError={() => setImageError(true)}
                        onLoad={() => setImageError(false)}
                    />
                ) : (
                    <View style={styles.fallbackAvatar}>
                        <User size={28} color="#6b7280" />
                    </View>
                )}
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <LinearGradient
                    colors={[colors?.primary ?? '#62cff4', colors?.secondary ?? '#2c67f2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${0}%` }]}
                />

                <View
                    style={[
                        styles.bubble,
                        {
                            left: Math.max(
                                8,
                                Math.min(
                                    width - 56,
                                    (width - 64) * 0.33,
                                ),
                            ),
                        },
                    ]}
                >
                    <Text style={[styles.bubbleText, { color: colors?.text ?? '#ffffff' }]}>{0}%</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarButton: {
        width: 60,
        height: 60,
        borderRadius: 9999,
        borderWidth: 2,
        borderColor: 'rgba(107, 114, 128, 0.5)',
        backgroundColor: 'rgba(209, 213, 219, 0.2)',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    fallbackAvatar: {
        width: 60,
        height: 60,
        borderRadius: 9999,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(209, 213, 219, 1)',
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    progressBarContainer: {
        width: '60%',
        left: -28,
        height: 30,
        borderRadius: 9999,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
        overflow: 'hidden',
        justifyContent: 'center',
        zIndex: 10,
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderTopLeftRadius: 9999,
        borderBottomLeftRadius: 9999,
    },
    bubble: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: '-50%' }],
        width: 48,
        borderRadius: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubbleText: {
        fontWeight: 'bold',
        fontSize: 10,
    },
});
