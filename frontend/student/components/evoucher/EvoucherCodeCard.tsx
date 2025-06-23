import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface EvoucherCodeCardProps {
    imageSource: any;
    onPress?: () => void;
    isUsed?: boolean;
    code?: string;
}

export const EvoucherCodeCard = ({
    imageSource,
    onPress,
    isUsed = false,
    code,
}: EvoucherCodeCardProps) => {
    return (
        <TouchableOpacity style={[styles.card, isUsed && styles.usedCard]} onPress={onPress}>
            <Image source={imageSource} style={styles.cardImage} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        height: 150,
        backgroundColor: '#282860',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#818181',
        overflow: 'hidden',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
        position: 'relative',
    },
    usedCard: {
        opacity: 0.7,
        borderColor: '#666',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    codeOverlay: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    codeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    usedText: {
        color: '#ff6b6b',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
});

export default EvoucherCodeCard; 