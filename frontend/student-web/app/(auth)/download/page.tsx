'use client';

import { useDisclosure, Button, Form, Input } from '@heroui/react';
import { Eye, EyeClosed, LockIcon, UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';


import lobby from '@/public/lobby.png';
import useAuth from '@/hooks/useAuth';

export default function DownloadPage() {
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

  return (
    <div className="min-h-screen flex">
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
        <div className='relative '>
          <h2 className="text-4xl font-bold text-white md:text-gray-900 text-center">
            Download
          </h2>
          <h2 className="text-4xl font-bold text-white md:text-gray-900 text-center">
            HLLC Application
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-6">
            <a
              href="/hllc.apk"
              download
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-48 aspect-[6/2] bg-white rounded-lg shadow-lg flex items-center justify-center p-4"
            >
              <img
                src="/images/android_btn.png"
                alt="Download on Android"
                className="object-fit "
              />
            </a>
            <a
              href="https://apps.apple.com/app/id6748238190"
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-48 aspect-[6/2]"
            >
              <img
                src="/images/appstore_btn.png"
                alt="Download on iOS"
                className="object-fit"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
