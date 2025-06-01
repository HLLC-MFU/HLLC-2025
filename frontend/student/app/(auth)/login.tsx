import useAuth from '@/hooks/useAuth';
import React, { useRef, useState } from 'react';
import {
  Button,
  Input,
  SizableText,
  View,
  YStack,
  XStack,
  Sheet,
  Select,
} from 'tamagui';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { ChevronDown, Eye, EyeOff } from '@tamagui/lucide-icons';
import { useToastController } from '@tamagui/toast';

export default function LoginScreen() {
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSecureText, setRegSecureText] = useState(true);
  const [regRole, setRegRole] = useState('');

  const { signIn } = useAuth();
  const toast = useToastController();
  const shiftAnim = useRef(new Animated.Value(0)).current;

  const [isRegisterSheetOpen, setIsRegisterSheetOpen] = useState(false);

  const handleFocus = () => {
    Animated.timing(shiftAnim, {
      toValue: -40,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleLogin = async () => {
    if (!username || !password) {
      toast.show('Invalid Credentials', {
        message: 'Please check username and password',
        type: 'error',
      });
      return;
    }

    const success = await signIn(username, password);

    if (success) {
      toast.show('Login Success', {
        message: 'Welcome back!',
        type: 'success',
      });
    } else {
      toast.show('Login failed.', {
        message: 'Please check your username and password.',
        type: 'error',
      });
    }
  };

  const handleRegister = () => {
    if (!regName || !regUsername || !regPassword || !regConfirmPassword) {
      toast.show('Missing fields', {
        message: 'Please fill all fields.',
        type: 'error',
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.show('Password mismatch', {
        message: 'Passwords do not match.',
        type: 'error',
      });
      return;
    }

    // Submit register logic here (API call, etc.)
    toast.show('Registration successful!', {
      message: 'You can now sign in.',
      type: 'success',
    });

    setIsRegisterSheetOpen(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$4"
        rowGap={12}
      >
        <Text style={{ fontSize: 40, fontWeight: 'bold' }}>Sign In</Text>
        <SizableText fontSize={20} fontWeight="bold">
          Let's start your journey
        </SizableText>
        <Animated.View
          style={{
            transform: [{ translateY: shiftAnim }],
            width: '100%',
          }}
        >
          <YStack gap="$4" width={'100%'}>
            <Input
              height={50}
              width={'100%'}
              borderWidth={2}
              focusStyle={{ borderColor: '$colorFocus' }}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />
            <XStack
              alignItems="center"
              borderWidth={2}
              borderColor={'$borderColor'}
              borderRadius="$4"
              focusStyle={{ borderColor: '$colorFocus' }}
              height={50}
              paddingRight={'$3'}
            >
              <Input
                flex={1}
                placeholder="Password"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
                borderWidth={0}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                {secureText ? <EyeOff size={24} /> : <Eye size={24} />}
              </TouchableOpacity>
            </XStack>
          </YStack>
        </Animated.View>
        <SizableText width={'100%'} textAlign="right" onPress={() => {}}>
          Forgot Password?
        </SizableText>
        <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
          <Button flex={1} onPress={() => setIsRegisterSheetOpen(true)}>
            Register
          </Button>
          <Button flex={1} onPress={handleLogin}>
            Sign In
          </Button>
        </View>

        <View
          style={{ backgroundColor: '#00000025', height: 1, width: '100%' }}
        />
        <Button width={'100%'}>CONTACT US</Button>
      </View>

      {/* Register Sheet */}
      <Sheet
        open={isRegisterSheetOpen}
        onOpenChange={setIsRegisterSheetOpen}
        zIndex={100_000}
        snapPoints={[90, 10]}
        animation="spring"
        dismissOnSnapToBottom
      >
        <Sheet.Overlay
          animation="lazy"
          backgroundColor="$shadow6"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Handle />

        <Sheet.Frame
          padding="$4"
          justifyContent="flex-start"
          alignItems="center"
          gap="$5"
        >
          <SizableText fontSize={20} fontWeight="bold">
            Create Account
          </SizableText>
          <YStack gap="$3" width={'100%'}>
            <Input
              height={50}
              width={'100%'}
              borderWidth={2}
              focusStyle={{ borderColor: '$colorFocus' }}
              placeholder="Username"
              value={regUsername}
              onChangeText={setRegUsername}
              style={{ backgroundColor: 'white' }}
            />
            <Input
              height={50}
              width={'100%'}
              borderWidth={2}
              focusStyle={{ borderColor: '$colorFocus' }}
              placeholder="Full Name"
              value={regName}
              onChangeText={setRegName}
              style={{ backgroundColor: 'white' }}
            />
            <XStack
              alignItems="center"
              borderWidth={2}
              borderColor={'$borderColor'}
              borderRadius="$4"
              focusStyle={{ borderColor: '$colorFocus' }}
              height={50}
              paddingRight={'$3'}
              style={{ backgroundColor: 'white' }}
            >
              <Input
                flex={1}
                placeholder="Password"
                secureTextEntry={regSecureText}
                value={regPassword}
                onChangeText={setRegPassword}
                borderWidth={0}
                style={{ backgroundColor: 'white' }}
              />
              <TouchableOpacity
                onPress={() => setRegSecureText(!regSecureText)}
              >
                {regSecureText ? <EyeOff size={24} /> : <Eye size={24} />}
              </TouchableOpacity>
            </XStack>
            <Input
              height={50}
              width={'100%'}
              borderWidth={2}
              focusStyle={{ borderColor: '$colorFocus' }}
              placeholder="Confirm Password"
              secureTextEntry
              value={regConfirmPassword}
              onChangeText={setRegConfirmPassword}
              style={{ backgroundColor: 'white' }}
            />
            {/* Select Role */}
            <Select
              value={regRole}
              onValueChange={setRegRole}
              disablePreventBodyScroll
            >
              <Select.Trigger
                iconAfter={ChevronDown}
                borderWidth={2}
                focusStyle={{ borderColor: '$colorFocus' }}
                style={{ backgroundColor: 'white', height: 50 }}
              >
                <Select.Value placeholder="Select Role" />
              </Select.Trigger>
              <Select.Content zIndex={200_000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  <Select.Item index={0} value="student">
                    <Select.ItemText>Student</Select.ItemText>
                  </Select.Item>
                  <Select.Item index={1} value="teacher">
                    <Select.ItemText>Teacher</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>

            <Button width="100%" onPress={handleRegister}>
              Create Account
            </Button>
            <Button width="100%" onPress={() => setIsRegisterSheetOpen(false)}>
              Cancel
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
