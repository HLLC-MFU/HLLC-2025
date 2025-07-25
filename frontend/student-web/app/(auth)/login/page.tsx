'use client';

import { useDisclosure, Button, Form, Input } from '@heroui/react';
import { Eye, EyeClosed, LockIcon, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import RegisterModal from './_components/register-modal';
import ForgetPasswordModal from './_components/forgetPassword-modal';

import lobby from '@/public/lobby.png';
import useAuth from '@/hooks/useAuth';

export default function LoginPage() {
  const {
    isOpen: isRegisterOpen,
    onOpen: onRegisterOpen,
    onOpenChange: onRegisterOpenChange,
  } = useDisclosure();
  const {
    isOpen: isForgetOpen,
    onOpen: onForgetOpen,
    onOpenChange: onForgetOpenChange,
  } = useDisclosure();

  const router = useRouter();
  const [isPasswordVisible, setPasswordIsVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const togglePasswordVisibility = () => setPasswordIsVisible(prev => !prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(username, password);
      router.push('/');
    } catch (error) {
      console.log('Login error', error);
    } finally {
      setIsLoading(false);
    }
  };
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    handleResize(); // initial check
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex">
      {isMobile && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-primary text-white text-center py-2 px-4 shadow-md flex items-center justify-between">
          <span className="text-sm font-medium">
            Get our mobile app for the best experience!
          </span>
          <Button
            className="ml-4 text-xs font-semibold"
            radius="full"
            onPress={() => {
              router.push('/download'); // Adjust the route as needed
            }}
          >
            Download
          </Button>
        </div>
      )}

      {/* Left Illustration */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-[#f5f5f5]">
        <div className="relative w-full h-full">
          <Image
            fill
            priority
            alt="Login Illustration"
            className="object-cover"
            src={lobby} // replace with your image path
          />
        </div>
      </div>

      {/* Right Form (with image as background on small screens) */}
      <div className="relative flex w-full md:w-1/2 items-center justify-center px-6 h-dvh md:h-auto">
        {/* Background image for small screens */}
        <div className="absolute inset-0 md:hidden z-0">
          <Image
            fill
            priority
            alt="Login Illustration"
            className="object-cover"
            src={lobby}
          />
          {/* Optional blur overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>

        {/* Form content */}
        <div className="relative z-10 max-w-md w-full space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white md:text-gray-900 text-center">
              LOGIN
            </h2>
            <p className="mt-1 text-md text-gray-50 md:text-gray-500 text-center">
              Let&apos;s Start your journey
            </p>
          </div>

          <Form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              required
              autoComplete="username"
              label="Student ID"
              placeholder="Student ID"
              radius="full"
              startContent={<UserIcon className="text-default-400" />}
              value={username}
              onValueChange={setUsername}
            />
            <Input
              required
              autoComplete="username"
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  {isPasswordVisible ? (
                    <Eye className="text-default-400" />
                  ) : (
                    <EyeClosed className="text-default-400" />
                  )}
                </button>
              }
              label="Password"
              placeholder="Password"
              radius="full"
              startContent={<LockIcon className="text-default-400" />}
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              onValueChange={setPassword}
            />

            <div className="w-full text-right">
              <button
                className="text-sm text-white md:text-primary hover:underline"
                type="button"
                onClick={() => router.push('/forgot-password')}
              >
                Forgot password?
              </button>
            </div>

            <div className="flex items-center justify-between w-full gap-4">
              <Button
                fullWidth
                className="bg-white text-gray-800 font-bold md:bg-primary md:text-white"
                isLoading={isLoading}
                radius="full"
                size="lg"
                type="submit"
              >
                LOGIN
              </Button>
              <Button
                fullWidth
                className="text-white border-white md:text-gray-500 font-bold md:border-gray-500"
                isLoading={isLoading}
                radius="full"
                size="lg"
                variant="bordered"
                onPress={() => router.push('/register')}
              >
                REGISTER
              </Button>
            </div>
          </Form>
        </div>
      </div>

      {/* Modals */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onOpenChange={onRegisterOpenChange}
      />
      <ForgetPasswordModal
        isOpen={isForgetOpen}
        onOpenChange={onForgetOpenChange}
      />
    </div>
  );
}
