import { Stack } from "expo-router";

export default function ActivitiesLayout( ) {
    return (
        <Stack screenOptions={{
            contentStyle: { backgroundColor: 'transparent' },
        }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Activities',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Activity Details',
                    headerShown: false,
                }}
            />
        </Stack>
    )
}