import { Card, Text,Image, YStack } from "tamagui";
interface IActivity {
    title: string;
    description: string;
    imageUri?: string;
}
export default function ActivityCard({ activity }: { activity: IActivity }) {
    return (
        <Card bordered>
            {activity.imageUri && (
                <Image
                    source={{ uri: activity.imageUri }}
                    width="100%"
                    aspectRatio={16 / 9}
                />
            )}
            <YStack style={{ padding: 16, gap: 8 }}>
                <Text style={{fontSize:22, fontWeight:"bold"}}>{activity.title}</Text>
                <Text>{activity.description}</Text>
            </YStack>
        </Card>
    );
}