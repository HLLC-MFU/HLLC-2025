import useAuth from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Province } from '@/types/auth';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useToastController } from '@tamagui/toast';
import provincesData from '@/data/provinces.json';
export default function LoginScreen() {
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [resetUsername, setResetUsername] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSecret, setResetSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sheet states



  // Hooks
  const { signIn, signUp, resetPassword } = useAuth();
  const toast = useToastController();

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
      />
    </KeyboardAvoidingView>
  );
}
