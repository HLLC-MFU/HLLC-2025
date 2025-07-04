import { User, Footprints, Award } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { Text, XStack, YStack, Separator, Progress } from 'tamagui';
import { t } from 'i18next';
import { GlassButton } from '../ui/GlassButton';
import AssetImage from '../global/AssetImage';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react-native';
import { Alert } from 'react-native';

type ProgressSummaryCardProps = {
    healthData: {
        steps: number;
        deviceMismatch: boolean;
    };
    progressImage: string | null; // Relative path like "image.jpg"
    onPress?: () => void;
};

const baseImageUrl = process.env.EXPO_PUBLIC_API_URL;

export function ProgressSummaryCard({
    healthData,
    progressImage,
    onPress,
}: ProgressSummaryCardProps) {
    const router = useRouter();

    return (
        <GlassButton onPress={onPress ?? (() => router.push('/(auth)/login'))}>
            {progressImage ? (
                <AssetImage
                    uri={`${baseImageUrl}/uploads/${progressImage}`}
                    style={{ width: 20, height: 20 }}
                />
            ) : (
                <User
                    color="white"
                    style={{ marginRight: 8 }}
                    size={20}
                />
            )}
            <YStack gap={4}>
                {/* Progress */}
                <YStack>
                    <Text
                        style={{
                            color: 'white',
                            fontWeight: '600',
                            fontSize: 12,
                            marginLeft: 8,
                            marginBottom: 2,
                        }}
                    >
                        {t('nav.progress')}
                    </Text>
                    <XStack alignItems="center" gap={4}>
                        <Progress value={60} size="$1" width={120} height={12} marginLeft={8}>
                            <Progress.Indicator />
                        </Progress>
                        <Text
                            style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: 12,
                                marginLeft: 4,
                                marginBottom: 2,
                            }}
                        >
                            60%
                        </Text>
                    </XStack>
                </YStack>

                <Separator marginLeft={8} borderColor={"#ffffff40"} />

                {/* Stats */}
                <XStack justifyContent="space-evenly">
                    <XStack style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Footprints size={14} color="white" />
                        <Text
                            style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: 14,
                                marginLeft: 8,
                            }}
                        >
                            {healthData.steps || 0}
                        </Text>
                        {healthData.deviceMismatch && (
                            <CircleAlert
                                size={14}
                                color="white"
                                style={{ marginLeft: 4 }}
                                onPress={() => {
                                    // Optional: show alert or explanation
                                    Alert.alert('Device Mismatch', 'Your current device ID does not match the one registered.', [
                                        {
                                            text: 'OK',
                                            onPress: () => console.log('OK Pressed'),
                                        },
                                        {
                                            text: 'Learn More',
                                            onPress: () => router.push('/step-counter'),
                                        },
                                    ]);
                                }}
                            />
                        )}
                    </XStack>

                    <Separator vertical borderColor={"#ffffff40"} />

                    <XStack style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Award size={14} color={"white"} />
                        <Text
                            style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: 14,
                                marginLeft: 8,
                            }}
                        >
                            85
                        </Text>
                    </XStack>
                </XStack>
            </YStack>
        </GlassButton>
    );
}
