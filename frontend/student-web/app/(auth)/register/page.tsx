'use client';

import { useEffect, useState } from 'react';
import {
  addToast,
  Button,
  Form,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { Eye, EyeClosed, LockIcon, MapPin, UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import lobby from '@/public/lobby.png';
import useAuth from '@/hooks/useAuth';
import { apiRequest } from '@/utils/api';
import { Province } from '@/types/user';
// import { Province } from '@/types/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [disabled, setDisabled] = useState(true);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const togglePasswordVisibility = () => setPasswordVisible(prev => !prev);
  const toggleConfirmVisibility = () => setConfirmVisible(prev => !prev);

  useEffect(() => {
    fetch('/data/province.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load province list');

        return res.json();
      })
      .then(data => setProvinces(data));
  }, []);

  useEffect(() => {
    const fetchInfo = async () => {
      if (username.length === 10 && /^\d+$/.test(username)) {
        setIsFetching(true);
        try {
          const res = await apiRequest<{
            user?: {
              name: { first: string; middle?: string; last: string };
              province: string;
            };
          }>(`/auth/student/status/${username}`, 'GET');

          if (res.statusCode === 200 && res.data?.user) {
            const u = res.data.user;
            const fullName =
              `${u.name.first} ${u.name.middle || ''} ${u.name.last}`.trim();

            setName(fullName);
            setProvince(u.province);
            setDisabled(false);
          } else {
            alert(res.message || 'Invalid student ID');
            setName('');
            setProvince('');
            setDisabled(true);
          }
        } finally {
          setIsFetching(false);
        }
      } else {
        // If username invalid or cleared, clear all dependent fields here
        setName('');
        setProvince('');
        setDisabled(true);
      }
    };

    fetchInfo();
  }, [username]);

  const validatePassword = (pwd: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
  };

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
      const result = await register({
        username,
        password,
        confirmPassword,
        metadata: {
          secret: province, // Replace with your actual logic
        },
      });

      if (result === true) {
        router.push('/');
      } else {
        alert(result); // result is an error string
      }
    } catch (err) {
      addToast({
        title: 'Registration Error',
        color: 'danger',
        description: (err as Error).message || 'An unexpected error occurred.',
        variant: 'solid',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Image for md+ */}
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

      {/* Right Form */}
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
              REGISTER
            </h2>
            <p className="mt-1 text-md text-gray-50 md:text-gray-500 text-center">
              Create your account
            </p>
          </div>

          <Form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              required
              label="Student ID"
              maxLength={10}
              placeholder="10-digit Student ID"
              radius="full"
              startContent={<UserIcon />}
              value={username}
              onValueChange={setUsername}
            />

            <Input
              disabled={true}
              label="Name"
              placeholder="Full Name"
              radius="full"
              startContent={<UserIcon />}
              value={name}
            />

            <Input
              required
              endContent={
                <button type="button" onClick={togglePasswordVisibility}>
                  {isPasswordVisible ? <Eye /> : <EyeClosed />}
                </button>
              }
              isDisabled={disabled}
              label="Password"
              placeholder="Password"
              radius="full"
              startContent={<LockIcon />}
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              onValueChange={setPassword}
            />

            <Input
              required
              endContent={
                <button type="button" onClick={toggleConfirmVisibility}>
                  {isConfirmVisible ? <Eye /> : <EyeClosed />}
                </button>
              }
              isDisabled={disabled}
              label="Confirm Password"
              placeholder="Confirm Password"
              radius="full"
              startContent={<LockIcon />}
              type={isConfirmVisible ? 'text' : 'password'}
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />

            <Select
              isDisabled={disabled}
              label="Province"
              radius="full"
              selectedKeys={[province]}
              startContent={<MapPin />}
              onSelectionChange={keys =>
                setProvince(String(Array.from(keys)[0]))
              }
            >
              {provinces.map(p => {
                return <SelectItem key={p.name_en}>{p.name_en}</SelectItem>;
              })}
            </Select>

            <Button
              fullWidth
              color="primary"
              isLoading={isLoading}
              radius="full"
              size="lg"
              type="submit"
            >
              CREATE ACCOUNT
            </Button>
            <div className="relative my-6 text-center w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/50" />
              </div>
            </div>

            <p className="text-sm text-white md:text-gray-500 text-center w-full">
              Already have an account?{' '}
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
