"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, EyeClosed, Eye, Lock } from "lucide-react";
import { Button, Checkbox, Form, Input } from "@heroui/react";
import useAuth from "@/hooks/useAuth";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    try{
      event.preventDefault();
      setIsLoading(true);
      await signIn(username, password);
      router.push("/");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full w-full flex items-center justify-between overflow-y-hidden">
      <div className="hidden md:flex h-full w-full p-8 max-w-[50%]">
        <div className="h-full w-full bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 overflow-hidden rounded-2xl">
          <div className="z-20 flex flex-col items-center justify-center w-full p-12 text-white">
            <h1 className="text-4xl font-bold mb-6 text-center">Elevate Your Experience</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full p-16 grow items-center">
        <Form className="gap-6 flex flex-col w-full max-w-lg grow" onSubmit={onSubmit}>
          <div className="w-full text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to access your account</p>
          </div>

          <Input
            label="Username"
            labelPlacement="outside"
            placeholder="John.doe"
            startContent={
              <User className="text-2xl text-default-400 flex-shrink-0" />
            }
            type="text"
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            labelPlacement="outside"
            startContent={
              <Lock className="text-2xl text-default-400 flex-shrink-0" />
            }
            endContent={
              <div
                role="button"
                tabIndex={0}
                onClick={toggleVisibility}
                className="cursor-pointer"
              >
                {isVisible ? (
                  <Eye className="text-2xl text-default-400" />
                ) : (
                  <EyeClosed className="text-2xl text-default-400" />
                )}
              </div>
            }
            label="Password"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Checkbox defaultSelected>Remember me</Checkbox>
          <Button color="primary" type="submit" isLoading={isLoading} className="w-full">
            Login
          </Button>
        </Form>
      </div>

      <div className="absolute bottom-16 -left-16 w-64 h-64 rounded-full bg-purple-700/30 blur-3xl"></div>
      <div className="absolute top-1/4 right-16 w-72 h-72 rounded-full bg-pink-600/20 blur-3xl"></div>
      <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl"></div>
    </div>
  );
}
