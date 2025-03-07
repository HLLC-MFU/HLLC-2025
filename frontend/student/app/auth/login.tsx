import { useState } from "react";

import { View, Button, Input } from "tamagui";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ActivityIndicator, Alert } from "react-native";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      await signIn(username, password);
      router.replace("/"); // Redirect to Home after login
    } catch (error) {
      Alert.alert("Login Failed", "Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Input
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderBottomWidth: 1, marginBottom: 15, padding: 8 }}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderBottomWidth: 1, marginBottom: 15, padding: 8 }}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#D30606" />
      ) : (
        <Button onPress={handleLogin} >Login</Button>
      )}
      <Button onPress={() => router.push("/auth/signup")} >SignUP</Button>
    </View>
  );
}
