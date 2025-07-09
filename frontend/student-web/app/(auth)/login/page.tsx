'use client';

import { useDisclosure, Button, Form, Input } from '@heroui/react';
import { Eye, EyeClosed, LockIcon, UserIcon } from 'lucide-react';
import { useState } from 'react';

import RegisterModal from './_components/register-modal';
import { useRouter } from "next/navigation";
import useAuth from '@/hooks/useAuth';

export default function LoginPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
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
      router.push("/");
    } catch (error) {
      console.log('Login error', error);
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <section className="flex h-full flex-col items-center justify-center gap-4 py-8 md:py-10 mx-4">
      <div className="inline-block max-w-xl text-center justify-center">
        <h3 className="text-3xl font-bold">Welcome Back</h3>
        <p className="text-lg text-gray-600">
          Let&rsquo;s start your journey with us.
        </p>
      </div>

      <Form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Username"
          size="lg"
          startContent={<UserIcon className="text-default-400" />}
          value={username}
          onValueChange={setUsername}
        />
        <Input
          endContent={
            <button
              aria-label="Toggle password visibility"
              className="focus:outline-none"
              type="button"
              onClick={togglePasswordVisibility}
            >
              {isPasswordVisible ? (
                <Eye className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <EyeClosed className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          label="Password"
          size="lg"
          startContent={<LockIcon className="text-default-400" />}
          type={isPasswordVisible ? 'text' : 'password'}
          value={password}
          onValueChange={setPassword}
        />
        <div className="w-full flex flex-col items-end">
          <Button variant="light">Forgot Password?</Button>
        </div>
        <div className="w-full flex gap-4">
          <Button
            className="w-full flex-1"
            size="lg"
            type="button"
            onPress={onOpen}
          >
            Register
          </Button>
          <Button
            className="w-full flex-1"
            color="primary"
            size="lg"
            type="submit"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </div>
      </Form>

      <RegisterModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </section>
  );
}
