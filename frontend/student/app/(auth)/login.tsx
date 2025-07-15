import useAuth from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Province } from '@/types/auth';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useToastController } from '@tamagui/toast';
import provincesData from '@/data/provinces.json';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
export default function LoginScreen() {
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSecret, setRegSecret] = useState('');
  const [resetUsername, setResetUsername] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSecret, setResetSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sheet states
  const [isRegisterSheetOpen, setIsRegisterSheetOpen] = useState(false);
  const [isForgotPasswordSheetOpen, setIsForgotPasswordSheetOpen] = useState(false);
  const [isRegisterProvinceSheetOpen, setIsRegisterProvinceSheetOpen] = useState(false);
const [isResetProvinceSheetOpen, setIsResetProvinceSheetOpen] = useState(false);


  // Hooks
  const { signIn, signUp, resetPassword } = useAuth();
  const toast = useToastController();
  const [provinces] = useState<Province[]>(provincesData);

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
      toast.show('Login Success', { message: 'Welcome back!', type: 'success' });
    } else {
      toast.show('Login failed.', {
        message: 'Please check your username and password.',
        type: 'error',
      });
    }
  };

  const handleLoginAfterRegister = async (username: string, password: string) => {
    const loginSuccess = await signIn(username, password);
    if (loginSuccess) {
      toast.show('Login Success', { message: 'Welcome back!', type: 'success' });
    } else {
      toast.show('Login failed.', {
        message: 'Please check your username and password.',
        type: 'error',
      });
    }
  };

  const handleRegister = async () => {
    if (!regUsername || !regPassword || !regConfirmPassword || !regSecret) {
      toast.show('Missing fields', { message: 'Please fill all fields.', type: 'error' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.show('Password mismatch', { message: 'Passwords do not match.', type: 'error' });
      return;
    }

    const registerData = {
      username: regUsername,
      password: regPassword,
      confirmPassword: regConfirmPassword,
      metadata: {
        secret: regSecret
      }
    };
    const success = await signUp(registerData);

    if (success) {
      toast.show('Registration successful!', { message: 'Welcome to the platform!', type: 'success' });
      setIsRegisterSheetOpen(false);
      await handleLoginAfterRegister(regUsername, regPassword);
    } else {
      toast.show('Registration failed', { message: 'Please try again later.', type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!resetUsername || !resetPasswordValue || !resetConfirmPassword || !resetSecret) {
      toast.show('กรุณากรอกข้อมูลให้ครบ', { message: 'กรุณากรอกข้อมูลทุกช่อง', type: 'error' });
      return;
    }

    if (resetPasswordValue !== resetConfirmPassword) {
      toast.show('รหัสผ่านไม่ตรงกัน', { message: 'กรุณากรอกรหัสผ่านให้ตรงกัน', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const resetData = {
        username: resetUsername,
        password: resetPasswordValue,
        confirmPassword: resetConfirmPassword,
        metadata: {
          secret: resetSecret
        }
      };

      const success = await resetPassword(resetData);

      if (success) {
        toast.show('รีเซ็ตรหัสผ่านสำเร็จ', {
          message: 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว',
          type: 'success',
        });
        setResetUsername('');
        setResetPasswordValue('');
        setResetConfirmPassword('');
        setResetSecret('');
        setTimeout(() => {
          setIsForgotPasswordSheetOpen(false);
        }, 500);
      } else {
        const error = useAuth.getState().error;
        toast.show('รีเซ็ตรหัสผ่านไม่สำเร็จ', {
          message: error || 'กรุณาลองใหม่อีกครั้ง',
          type: 'error',
        });
      }
    } catch (err) {
      toast.show('รีเซ็ตรหัสผ่านไม่สำเร็จ', {
        message: (err as Error).message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LoginForm
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        onLogin={handleLogin}
        onRegister={() => setIsRegisterSheetOpen(true)}
        onForgotPassword={() => setIsForgotPasswordSheetOpen(true)}
      />

      <RegisterForm
        open={isRegisterSheetOpen}
        onOpenChange={setIsRegisterSheetOpen}
        username={regUsername}
        setUsername={setRegUsername}
        password={regPassword}
        setPassword={setRegPassword}
        confirmPassword={regConfirmPassword}
        setConfirmPassword={setRegConfirmPassword}
        secret={regSecret}
        setSecret={setRegSecret}
        provinces={provinces}
        isProvinceSheetOpen={isRegisterProvinceSheetOpen}
        setIsProvinceSheetOpen={setIsRegisterProvinceSheetOpen}
        onRegister={handleRegister}
      />

      <ResetPasswordForm 
      open={isForgotPasswordSheetOpen}
      onOpenChange={setIsForgotPasswordSheetOpen}
      username={resetUsername}
      setUsername={setResetUsername}
      password={resetPasswordValue}
      setPassword={setResetPasswordValue}
      confirmPassword={resetConfirmPassword}
      setConfirmPassword={setResetConfirmPassword}
      secret={resetSecret}
      setSecret={setResetSecret}
      provinces={provinces}
      isProvinceSheetOpen={isResetProvinceSheetOpen}
      setIsProvinceSheetOpen={setIsResetProvinceSheetOpen}
      onResetPassword={handleResetPassword}
      />
    </KeyboardAvoidingView>
  );
}
