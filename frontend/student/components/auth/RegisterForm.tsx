import React, { useEffect, useState } from 'react'
import {
  Button,
  Input,
  SizableText,
  YStack,
  XStack,
  Sheet,
  Separator
} from 'tamagui'
import { ProvinceSelector } from '@/components/ProvinceSelector'
import { Province } from '@/types/auth'
import { apiRequest } from '@/utils/api'
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import {
  User,
  Lock,
  EyeClosed,
  Eye,
  Map,
  ChevronDown
} from 'lucide-react-native'

interface RegisterFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  setUsername: (text: string) => void
  password: string
  setPassword: (text: string) => void
  confirmPassword: string
  setConfirmPassword: (text: string) => void
  secret: string
  setSecret: (text: string) => void
  provinces: Province[]
  isProvinceSheetOpen: boolean
  setIsProvinceSheetOpen: (open: boolean) => void
  onRegister: () => void
}

export const RegisterForm = ({
  open,
  onOpenChange,
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  secret,
  setSecret,
  provinces,
  isProvinceSheetOpen,
  setIsProvinceSheetOpen,
  onRegister
}: RegisterFormProps) => {
  const [name, setName] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(true)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(true)
  const [isLoadingUsername, setIsLoadingUsername] = useState(false)

  const fetchUserInfo = async (inputUsername: string) => {
    if (inputUsername.length !== 10 || !/^[0-9]+$/.test(inputUsername)) {
      alert('Student ID must be 10 digits numeric.')
      setUsername('')
      return
    }

    setIsDisabled(true)
    setIsLoadingUsername(true)

    try {
      const res = await apiRequest<{ user?: { name: { first: string; middle?: string; last: string }, province: string } }>(
        `/auth/student/status/${inputUsername}`,
        'GET'
      )

      if (res.statusCode === 200 && res.data?.user) {
        const u = res.data.user
        const fullName = `${u.name.first}${u.name.middle ? ' ' + u.name.middle : ''} ${u.name.last}`
        setName(fullName.trim())
        setSecret(u.province)
      } else {
        alert(res.message || 'Invalid user.')
        setUsername('')
        setName('')
        setSecret('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingUsername(false)
      setIsDisabled(false)
    }
  }

  useEffect(() => {
    setName('') // Clear name when username changes
    if (username.length === 10 && /^[0-9]+$/.test(username)) {
      fetchUserInfo(username)
    }
  }, [username])

  useEffect(() => {
    if (!open) {
      setUsername('')
      setPassword('')
      setConfirmPassword('')
      setSecret('')
      setName('')
      setIsPasswordVisible(true)
      setIsConfirmPasswordVisible(true)
      setIsDisabled(false)
      setIsLoadingUsername(false)
    }
  }, [open])

  const inputContainerStyle = {
    alignItems: 'center' as const,
    borderWidth: 2,
    paddingHorizontal: 12,
    height: 48,
    borderColor: '$borderColor',
    borderRadius: 16,
    focusStyle: {
      borderColor: '$colorFocus'
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      zIndex={100_000}
      snapPoints={[90, 10]}
      animation="spring"
      dismissOnSnapToBottom
    >
      <Sheet.Overlay animation="lazy" backgroundColor="$shadow6" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Handle />
      <Sheet.Frame padding="$4" justifyContent="flex-start" alignItems="center" gap="$5">
        <SizableText fontSize={20} fontWeight="bold">Create Account</SizableText>
        <YStack gap="$3" width="100%">
          <XStack {...inputContainerStyle}>
            <User />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor={'transparent'}
              placeholder="Student ID"
              value={username}
              onChangeText={setUsername}
              onBlur={() => {
                if (username.length !== 10 || !/^\d+$/.test(username)) {
                  alert('Student ID must be 10 digits numeric.')
                  setUsername('')
                }
              }}
              editable={!isDisabled}
              keyboardType="numeric"
              maxLength={10}
            />
            {isLoadingUsername && <ActivityIndicator size="small" color="#888" />}
          </XStack>

          <XStack {...inputContainerStyle}>
            <User />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor={'transparent'}
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
              backgroundColor={'transparent'}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              editable={!isDisabled}
              secureTextEntry={isPasswordVisible}
              onBlur={() => {
                if (password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
                  alert('Password must be at least 8 characters long and include uppercase, lowercase, and number.')
                  setPassword('')
                }
              }}
            />
            <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              {isPasswordVisible ? <EyeClosed /> : <Eye />}
            </Pressable>
          </XStack>

          <XStack {...inputContainerStyle}>
            <Lock />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor={'transparent'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isDisabled}
              secureTextEntry={isConfirmPasswordVisible}
              onBlur={() => {
                if (password !== confirmPassword) {
                  alert('Passwords do not match.')
                  setConfirmPassword('')
                }
              }}
            />
            <Pressable onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
              {isConfirmPasswordVisible ? <EyeClosed /> : <Eye />}
            </Pressable>
          </XStack>

          <XStack {...inputContainerStyle} onPress={() => setIsProvinceSheetOpen(true)} disabled={isDisabled}>
            <Map />
            <Input
              flex={1}
              editable={false}
              pointerEvents="none"
              borderWidth={0}
              backgroundColor="transparent"
              placeholder="Province"
              value={secret ? provinces.find(p => p.name_en === secret)?.name_th ?? '' : ''}
            />
            <ChevronDown />
          </XStack>

          <XStack width="100%">
            <Button flex={1} onPress={onRegister} disabled={isDisabled}>
              Create Account
            </Button>
          </XStack>

          <Separator />

          <Pressable onPress={() => onOpenChange(false)} style={{ width: '100%' }}>
            <SizableText fontSize={16} textAlign="center" color="$color">
              Already have an account? <SizableText fontWeight="bold">Login</SizableText>
            </SizableText>
          </Pressable>
        </YStack>

        <ProvinceSelector
          isOpen={isProvinceSheetOpen}
          onOpenChange={setIsProvinceSheetOpen}
          provinces={provinces}
          selectedProvince={secret}
          onSelect={setSecret}
        />
      </Sheet.Frame>
    </Sheet>
  )
}