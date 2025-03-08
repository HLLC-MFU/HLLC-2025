
import Input from "@/components/global/Input";
import Button from "@/components/global/Button";
import { useAuth } from "@/context/ctx";
import React, { useState } from "react";
import { ImageBackground, SafeAreaView, StyleSheet, Text } from "react-native";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { signIn } = useAuth();

    const handleLogin = async () => {
        await signIn(username, password);
      };
      
    return (
        <ImageBackground src="https://hllc.mfu.ac.th/_nuxt/background.QT0jUNm1.jpg" style={styles.background}>
            <SafeAreaView style={styles.container}>
                <Text style={styles.header}>Let's start your journey</Text>
                <Text style={styles.subHeader}>Login to Continue</Text>
                <Input value={username} onChange={setUsername} placeholder="Username" color="primary" size="sm"></Input>
                <Input value={username} onChange={setPassword} placeholder="Password" color="primary" size="sm"></Input>
                <Button color="primary" size="md" radius="full" fullWidth onPress={() => handleLogin()}>Login</Button>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center"
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        paddingHorizontal: 20,
    },
    header: {
        fontSize: 30,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
    },
    subHeader: {
        fontSize: 14,
        fontWeight: "semibold",
        color: "#f0f0f0",
        textAlign: "center",
    },
});