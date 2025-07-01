// app/(auth)/register.tsx
import { ProvinceSelector } from "@/components/ProvinceSelector";
import { apiRequest } from "@/utils/api";
import provincesData from "@/data/provinces.json";
import { router } from "expo-router";
import {
    User,
    Lock,
    EyeClosed,
    Eye,
    Map,
    ChevronDown,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from "react-native";
import {
    SizableText,
    YStack,
    XStack,
    Text,
    Input,
    Separator,
    Button,
} from "tamagui";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RegisterScreen() {
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [secret, setSecret] = useState("");
    const [isDisabled, setIsDisabled] = useState(false);
    const [isProvinceSheetOpen, setIsProvinceSheetOpen] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(true);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
        useState(true);
    const [isLoadingUsername, setIsLoadingUsername] = useState(false);

    const fetchUserInfo = async (inputUsername: string) => {
        if (inputUsername.length !== 10 || !/^[0-9]+$/.test(inputUsername)) {
            alert("Student ID must be 10 digits numeric.");
            setUsername("");
            return;
        }

        setIsDisabled(true);
        setIsLoadingUsername(true);

        try {
            const res = await apiRequest<{
                user?: {
                    name: { first: string; middle?: string; last: string };
                    province: string;
                };
            }>(`/auth/student/status/${inputUsername}`, "GET");

            if (res.statusCode === 200 && res.data?.user) {
                const u = res.data.user;
                const fullName = `${u.name.first}${u.name.middle ? " " + u.name.middle : ""
                    } ${u.name.last}`;
                setName(fullName.trim());
                setSecret(u.province);
            } else {
                alert(res.message || "Invalid user.");
                setUsername("");
                setName("");
                setSecret("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingUsername(false);
            setIsDisabled(false);
        }
    };

    useEffect(() => {
        setName("");
        if (username.length === 10 && /^[0-9]+$/.test(username)) {
            fetchUserInfo(username);
        }
    }, [username]);

    const onRegister = () => {
        if (!username || !password || !confirmPassword || !secret) {
            alert("Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        // Continue registration here...
        alert("Registered!");
    };

    const inputContainerStyle = {
        alignItems: "center" as const,
        borderWidth: 2,
        paddingHorizontal: 12,
        height: 48,
        borderColor: "$borderColor",
        borderRadius: 16,
        focusStyle: {
            borderColor: "$colorFocus",
        },
    };

    return (

        <KeyboardAvoidingView
            style={{ flexGrow: 1 }}
            behavior={Platform.select({ ios: "padding", android: undefined })}
        >
            <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", margin: 16 }}>
                <YStack gap="$3" width="100%">
                    <Text fontSize={28} fontWeight="bold">
                        Create Account
                    </Text>
                    <XStack {...inputContainerStyle}>
                        <User />
                        <Input
                            flex={1}
                            borderWidth={0}
                            backgroundColor={"transparent"}
                            placeholder="Student ID"
                            value={username}
                            onChangeText={setUsername}
                            onBlur={() => {
                                if (username.length !== 10 || !/^\d+$/.test(username)) {
                                    alert("Student ID must be 10 digits numeric.");
                                    setUsername("");
                                }
                            }}
                            editable={!isDisabled}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                        {isLoadingUsername && (
                            <ActivityIndicator size="small" color="#888" />
                        )}
                    </XStack>

                    <XStack {...inputContainerStyle}>
                        <User />
                        <Input
                            flex={1}
                            borderWidth={0}
                            backgroundColor={"transparent"}
                            placeholder="Name"
                            value={name}
                            editable={false}
                        />
                    </XStack>

                    <XStack {...inputContainerStyle}>
                        <Lock />
                        <Input
                            flex={1}
                            borderWidth={0}
                            backgroundColor={"transparent"}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            editable={!isDisabled}
                            secureTextEntry={isPasswordVisible}
                            onBlur={() => {
                                if (
                                    password.length < 8 ||
                                    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)
                                ) {
                                    alert(
                                        "Password must be at least 8 characters long and include uppercase, lowercase, and number."
                                    );
                                    setPassword("");
                                }
                            }}
                        />
                        <Pressable
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        >
                            {isPasswordVisible ? <EyeClosed /> : <Eye />}
                        </Pressable>
                    </XStack>

                    <XStack {...inputContainerStyle}>
                        <Lock />
                        <Input
                            flex={1}
                            borderWidth={0}
                            backgroundColor={"transparent"}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            editable={!isDisabled}
                            secureTextEntry={isConfirmPasswordVisible}
                            onBlur={() => {
                                if (password !== confirmPassword) {
                                    alert("Passwords do not match.");
                                    setConfirmPassword("");
                                }
                            }}
                        />
                        <Pressable
                            onPress={() =>
                                setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                            }
                        >
                            {isConfirmPasswordVisible ? <EyeClosed /> : <Eye />}
                        </Pressable>
                    </XStack>

                    <XStack
                        {...inputContainerStyle}
                        onPress={() => setIsProvinceSheetOpen(true)}
                        disabled={isDisabled}
                    >
                        <Map />
                        <Input
                            flex={1}
                            editable={false}
                            pointerEvents="none"
                            borderWidth={0}
                            backgroundColor="transparent"
                            placeholder="Province"
                            value={
                                secret
                                    ? provincesData.find((p) => p.name_en === secret)?.name_th ?? ""
                                    : ""
                            }
                        />
                        <ChevronDown />
                    </XStack>

                    <XStack width="100%">
                        <Button flex={1} onPress={onRegister} disabled={isDisabled}>
                            Create Account
                        </Button>
                    </XStack>

                    <Separator />

                    <Pressable
                        onPress={() => router.back()}
                        style={{ width: "100%" }}
                    >
                        <SizableText fontSize={16} textAlign="center" color="$color">
                            Already have an account?{" "}
                            <SizableText fontWeight="bold">Login</SizableText>
                        </SizableText>
                    </Pressable>
                </YStack>

            </SafeAreaView>


            <ProvinceSelector
                isOpen={isProvinceSheetOpen}
                onOpenChange={setIsProvinceSheetOpen}
                provinces={provincesData}
                selectedProvince={secret}
                onSelect={setSecret}
            />
        </KeyboardAvoidingView>
    );
}
