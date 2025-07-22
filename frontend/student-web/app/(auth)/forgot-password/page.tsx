'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  SelectItem,
  addToast,
} from '@heroui/react';
import { Eye, EyeClosed, LockIcon, MapPin, UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import lobby from '@/public/lobby.png';
import { apiRequest } from '@/utils/api';
import { Province } from '@/types/user';
import useAuth from '@/hooks/useAuth';

interface ResetPasswordPageProps {
  provinces: Province[];
  onResetPassword: (data: {
    username: string;
    password: string;
    confirmPassword: string;
    secret: string;
  }) => Promise<boolean | string>; // success or error message
}

export default function ResetPasswordPage({
  onResetPassword,
}: ResetPasswordPageProps) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const router = useRouter();
  const { resetPassword } = useAuth();
  const isSelectDisabled = isLoading;

  useEffect(() => {
    fetch('/data/province.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load province list');

        return res.json();
      })
      .then(data => setProvinces(data));
  }, []);

  // Fetch user info when username or secret changes
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (username.length === 10 && /^\d+$/.test(username) && secret) {
        setIsFetchingUser(true);
        try {
          const res = await apiRequest<{
            user?: {
              name: { first: string; middle?: string; last: string };
              province: string;
            };
            message?: string;
          }>('/auth/check-reset-password-eligibility', 'POST', {
            username,
            secret,
          });

          if (res.statusCode === 201 && res.data?.user) {
            const u = res.data.user;
            const fullName =
              `${u.name.first} ${u.name.middle || ''} ${u.name.last}`.trim();

            setName(fullName);
            setDisabled(false);
          } else if (res.message === 'Invalid secret') {
            alert('Invalid province or secret. Please try again.');
            setName('');
            setSecret('');
            setDisabled(true);
          } else {
            alert(res.message || 'Invalid user.');
            setName('');
            setSecret('');
            setDisabled(true);
          }
        } catch (err) {
          console.error(err);
          alert('Failed to fetch user info.');
          setName('');
          setSecret('');
          setDisabled(true);
        } finally {
          setIsFetchingUser(false);
        }
      } else {
        setName('');
        setSecret('');
        setDisabled(true);
      }
    };

    fetchUserInfo();
  }, [username, secret]);

  const validatePassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match.');

      return;
    }

    if (!validatePassword(password)) {
      alert(
        'Password must be at least 8 characters long and include uppercase, lowercase, and number.',
      );

      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword({
        username,
        password,
        confirmPassword,
        metadata: { secret },
      });

      if (result === true) {
        addToast({
          title: 'Success',
          description: 'Password has been reset successfully.',
          color: 'success',
          variant: 'solid',
        });
        // Optionally redirect or clear form here
      } else {
        alert(result);
      }
    } catch (err) {
      alert('Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-1/2 items-center justify-center bg-[#f5f5f5]">
        <div className="relative w-full h-full">
          <Image
            fill
            priority
            alt="Register Illustration"
            className="object-cover"
            src={lobby}
          />
        </div>
      </div>
      <div className="relative flex w-full md:w-1/2 items-center justify-center px-6 h-dvh md:h-auto">
        <div className="absolute inset-0 md:hidden z-0">
          <Image
            fill
            priority
            alt="Background"
            className="object-cover"
            src={lobby}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 max-w-md w-full space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white md:text-gray-900 text-center">
              FORGOT PASSWORD
            </h2>
          </div>

          <Form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              required
              disabled={isLoading}
              label="Student ID"
              maxLength={10}
              placeholder="10-digit Student ID"
              radius="full"
              startContent={<UserIcon />}
              value={username}
              onBlur={() => {
                if (username.length !== 10 || !/^\d+$/.test(username)) {
                  alert('Student ID must be 10 digits numeric.');
                  setUsername('');
                }
              }}
              onValueChange={setUsername}
            />
            <Select
              isDisabled={isSelectDisabled}
              label="Province"
              radius="full"
              selectedKeys={[secret]}
              startContent={<MapPin />}
              onSelectionChange={keys => setSecret(String(Array.from(keys)[0]))}
            >
              {provinces.map(p => {
                return <SelectItem key={p.name_en}>{p.name_en}</SelectItem>;
              })}
            </Select>

            <Input
              disabled
              label="Full Name"
              placeholder="Your full name"
              radius="full"
              startContent={<UserIcon />}
              value={name}
            />

            <Input
              required
              endContent={
                <button
                  aria-label="Toggle password visibility"
                  className="p-1"
                  type="button"
                  onClick={() => setPasswordVisible(v => !v)}
                >
                  {isPasswordVisible ? <Eye /> : <EyeClosed />}
                </button>
              }
              isDisabled={disabled || isLoading}
              label="New Password"
              placeholder="Enter new password"
              radius="full"
              startContent={<LockIcon />}
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              onValueChange={setPassword}
            />

            <Input
              required
              endContent={
                <button
                  aria-label="Toggle confirm password visibility"
                  className="p-1"
                  type="button"
                  onClick={() => setConfirmVisible(v => !v)}
                >
                  {isConfirmVisible ? <Eye /> : <EyeClosed />}
                </button>
              }
              isDisabled={disabled || isLoading}
              label="Confirm Password"
              placeholder="Confirm new password"
              radius="full"
              startContent={<LockIcon />}
              type={isConfirmVisible ? 'text' : 'password'}
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />

            <Button
              fullWidth
              color="primary"
              disabled={disabled || isLoading}
              isLoading={isLoading}
              radius="full"
              size="lg"
              type="submit"
            >
              Reset Password
            </Button>
            <div className="relative my-6 text-center w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/50" />
              </div>
            </div>

            <p className="text-sm text-white md:text-gray-500 text-center w-full">
              Back to{' '}
              <button
                aria-label="Login here"
                className="text-blue-400 underline cursor-pointer bg-transparent border-none p-0 font-inherit"
                tabIndex={0}
                type="button"
                onClick={() => router.push('/login')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push('/login');
                  }
                }}
              >
                Login
              </button>
            </p>
          </Form>
        </div>
      </div>
    </div>
  );
}
