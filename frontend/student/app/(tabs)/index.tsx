import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, YStack } from "tamagui";
import { StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <YStack>
          <Text>Hello, Welcome to Home!</Text>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent", // ✅ Ensure transparency
  },
});
