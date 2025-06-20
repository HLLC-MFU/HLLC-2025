'use client';

import {
  Sheet,
  Input,
  Button,
  YStack,
  XStack,
  Text,
  Select,
  SelectItem,
  Spinner,
} from 'tamagui';
import { Eye, EyeOff, User2 } from '@tamagui/lucide-icons';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface Province {
  name_th: string;
  name_en: string;
}

interface CheckedUser {
  username: string;
  name: {
    first: string;
    middle?: string;
    last: string;
  };
}

interface RegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterSheet({ open, onOpenChange }: RegisterSheetProps) {
  const [studentId, setStudentId] = useState('');
  const [fetchedUser, setFetchedUser] = useState<CheckedUser | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [province, setProvince] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearForm = () => {
    setStudentId('');
    setPassword('');
    setConfirmPassword('');
    setFetchedUser(null);
  };

  const handleBlurStudentId = async () => {
    if (studentId.length !== 10) {
      Alert.alert('Invalid Student ID', 'Please enter a valid 10-digit student ID.');
      clearForm();
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/student/status/${studentId}`,
      );
      const data = await res.json();
      if (res.ok) {
        setFetchedUser(data.user);
      } else {
        Alert.alert('Error', data.message ?? 'No student found with this ID.');
        clearForm();
      }
    } catch {
      Alert.alert('Fetch Error', 'Unable to verify student ID.');
      clearForm();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await fetch('/data/province.json');
        const data = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error('Failed to load provinces:', err);
      }
    };
    loadProvinces();
  }, []);

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      dismissOnSnapToBottom
      snapPointsMode="fit"
      snapPoints={[90]}
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame padding="$4">
        <YStack space="$4">
          <Text fontSize="$8" fontWeight="700" textAlign="center">Register</Text>

          <Input
            size="$4"
            placeholder="Student ID (e.g. 6531503201)"
            value={studentId}
            onChangeText={setStudentId}
            onBlur={handleBlurStudentId}
            icon={<User2 />}
          />

          <Input
            size="$4"
            editable={false}
            placeholder="Full Name"
            value={
              fetchedUser
                ? `${fetchedUser.name.first} ${fetchedUser.name.middle ?? ''} ${fetchedUser.name.last}`.trim()
                : ''
            }
          />

          <XStack alignItems="center">
            <Input
              flex={1}
              size="$4"
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Button
              size="$2"
              onPress={() => setShowPassword(prev => !prev)}
              variant="outlined"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </XStack>

          <XStack alignItems="center">
            <Input
              flex={1}
              size="$4"
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Button
              size="$2"
              onPress={() => setShowConfirmPassword(prev => !prev)}
              variant="outlined"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </Button>
          </XStack>

          <Select
            size="$4"
            value={province ?? ''}
            onValueChange={setProvince}
            placeholder="Select province"
          >
            {provinces.map(p => (
              <SelectItem key={p.name_th} value={p.name_th}>
                {p.name_th}
              </SelectItem>
            ))}
          </Select>

          {loading && <Spinner size="large" />}

          <XStack justifyContent="space-between" space="$2">
            <Button flex={1} variant="outlined" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button flex={1} theme="active" onPress={() => {
              // ✅ submit logic here
            }}>
              Submit
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
