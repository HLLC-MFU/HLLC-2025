import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import Button from "@/components/global/Button";
import { useAuth } from "@/context/ctx";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const handleSignOut = () => {
    signOut();
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <Button onPress={() => handleSignOut()}>Sign Out</Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent", // ✅ Ensure transparency
  },
});
