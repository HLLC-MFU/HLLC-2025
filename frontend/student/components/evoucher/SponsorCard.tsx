import React from 'react';
import { StyleSheet, Image, TouchableOpacity, ImageSourcePropType, View, Text } from 'react-native';

interface SponsorCardProps {
    imageSource: ImageSourcePropType;
    title?: string;
    onPress?: () => void;
    hasEvoucherCodes?: boolean;
    evoucherCount?: number;
}

export const SponsorCard = ({ 
    imageSource, 
    title, 
    onPress,
    hasEvoucherCodes = false,
    evoucherCount = 0,
}: SponsorCardProps) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={imageSource} style={styles.cardImage} />
            {evoucherCount > 0 && (
                <View style={styles.evoucherIndicator}>
                    <Text style={styles.indicatorText}>{evoucherCount}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '46%',
        height: 100,
        backgroundColor: '#ffffff20',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#818181',
        marginBottom: 15,
        overflow: 'visible',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'relative',
        aspectRatio:1
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    evoucherIndicator: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#FF3B30', // Red
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        minWidth: 28,
        minHeight: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff', // White border for contrast
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 6,
        zIndex: 10,
    },
    indicatorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});

export default SponsorCard; 