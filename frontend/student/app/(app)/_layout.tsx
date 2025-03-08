import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/context/ctx";

export default function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
