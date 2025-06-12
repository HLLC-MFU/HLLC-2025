import { Stack } from "expo-router";

export default function ActivitiesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // you can turn this on if you want native header
        animation: "default", // smooth transition
      }}
    />
  );
}
