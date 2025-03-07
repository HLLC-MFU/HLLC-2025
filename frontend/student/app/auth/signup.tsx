import { useState } from "react";
import { View, Button, TextInput, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { apiRequest } from "@/lib/api/api";

export default function SignupScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!username || !password) {
      Alert.alert("Error", "Please enter a username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (response.success) {
        Alert.alert("Success", "Account created! Please login.");
        router.replace("/auth/login");
      } else {
        Alert.alert("Signup Failed", response.message || "Please try again.");
      }
    } catch (error) {
      Alert.alert("Signup Error", "An error occurred while signing up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderBottomWidth: 1, marginBottom: 15, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderBottomWidth: 1, marginBottom: 15, padding: 8 }}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#D30606" />
      ) : (
        <Button title="Sign Up" onPress={handleSignup} />
      )}
      <Button title="Go to Login" onPress={() => router.push("/auth/login")} />
    </View>
  );
}
