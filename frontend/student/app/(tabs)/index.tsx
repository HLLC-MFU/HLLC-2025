import FriendList from "@/components/home/FriendList";
import { Image, StyleSheet, Platform } from "react-native";
import { Avatar, Card, Input, ScrollView, Text, XStack, YStack } from "tamagui";

export default function HomeScreen() {
  const friends = 50;
  return (
    <ScrollView style={{ padding: 16 }}>
      <YStack style={{ gap: 16 }}>
        <XStack
          style={{
            flex: 1,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <YStack>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>Jemiezler</Text>
            <Text>Status goes here!</Text>
          </YStack>

          <Avatar circular size="$6">
            <Avatar.Image
              accessibilityLabel="Cam"
              src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
            />
            <Avatar.Fallback backgroundColor="$blue10" />
          </Avatar>
        </XStack>
        <Input size="$4" borderWidth={2} />

        <YStack style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Friends ({friends})</Text>
          {[...Array(friends)].map((_, index) => (
            <FriendList key={index} />
          ))}
        </YStack>
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
