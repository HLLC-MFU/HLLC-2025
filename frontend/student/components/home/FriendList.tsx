import { Avatar, XStack, YStack,Text } from "tamagui";

export default function FriendList() {
  return (
    <XStack style={{ padding: 8, gap: 16 }}>
      <Avatar circular size="$4">
        <Avatar.Image
          accessibilityLabel="Cam"
          src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
        />
        <Avatar.Fallback backgroundColor="$blue10" />
      </Avatar>
      <YStack>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>Cam</Text>
        <Text>Hey, how are you?</Text>
      </YStack>
    </XStack>
  );
}
