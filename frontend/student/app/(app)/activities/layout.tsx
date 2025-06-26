import { Stack } from "expo-router";

export default function ActivitiesLayout( ) {
    return (
        <Stack>
            <Stack.Screen
                name="activities/index"
                options={{
                    title: 'Activities',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="activities/[id]"
                options={{
                    title: 'Activity Details',
                    headerShown: false,
                }}
            />
        </Stack>
    )
}