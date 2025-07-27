"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, EyeClosed, Eye, Lock } from "lucide-react";
import { Button, Checkbox, Form, Input } from "@heroui/react";

import background from "@/public/images/background.png";
import useAuth from "@/hooks/useAuth";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(username, password);
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full relative md:flex items-center justify-between overflow-y-hidden md:p-2">
      <div className="absolute inset-0 md:relative md:flex h-full w-full grow">
        <Image
          fill
          priority
          alt="Background"
          className="object-cover md:rounded-[24px]"
          src={background}
        />
      </div>

      <div className="flex flex-col w-full h-full items-center justify-center p-4 md:p-0 md:max-w-[35%] md:px-12">
        <Form
          className="gap-6 flex flex-col w-full max-w-lg z-50 px-8 py-16 justify-center bg-white/75 md:bg-transparent text-black rounded-2xl backdrop-blur-md"
          onSubmit={onSubmit}
        >
          <div className="text-center w-full">
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your account
            </p>
          </div>

          <Input
            label="Username"
            labelPlacement="inside"
            placeholder="John.doe"
            startContent={
              <User className="text-2xl text-default-400 flex-shrink-0" />
            }
            type="text"
            value={username}
            variant="flat"
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            endContent={
              <button
                aria-label="Toggle password visibility"
                className="focus:outline-none"
                type="button"
                onClick={toggleVisibility}
              >
                {isVisible ? (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeClosed className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            label="Password"
            labelPlacement="inside"
            placeholder="Enter your password"
            startContent={
              <Lock className="text-2xl text-default-400 flex-shrink-0" />
            }
            type={isVisible ? "text" : "password"}
            value={password}
            variant="flat"
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* <Checkbox defaultSelected>Remember me</Checkbox> */}

          <Button className="w-full" color="primary" isLoading={isLoading} type="submit">
            Login
          </Button>
        </Form>
      </div>
    </div>
  );
}
