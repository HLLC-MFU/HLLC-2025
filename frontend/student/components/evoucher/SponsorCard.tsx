import React from 'react';
import { StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';

interface SponsorCardProps {
    imageSource: ImageSourcePropType;
    title?: string;
    onPress?: () => void;
    hasEvoucherCodes?: boolean;
}

export const SponsorCard = ({ 
    imageSource, 
    title, 
    onPress,
    hasEvoucherCodes = false,
}: SponsorCardProps) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={imageSource} style={styles.cardImage} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '46%',
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#818181',
        marginBottom: 15,
        overflow: 'hidden',
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
        top: 5,
        right: 5,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    indicatorText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default SponsorCard; 