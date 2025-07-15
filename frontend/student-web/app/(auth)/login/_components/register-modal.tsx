'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Select,
  SelectItem,
} from '@heroui/react';
import { Eye, EyeClosed, User2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { usePopupDialog } from '@/components/ui/dialog';
import { CheckedUser, Province } from '@/types/user';
import useAuth from '@/hooks/useAuth';

interface RegisterModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  user?: CheckedUser;
}

export default function RegisterModal({
  isOpen,
  onOpenChange,
  user: initialUser,
}: RegisterModalProps) {
  const [studentId, setStudentId] = useState(initialUser?.username ?? '');
  const [fetchedUser, setFetchedUser] = useState<CheckedUser | null>(
    initialUser ?? null,
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setPasswordIsVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordIsVisible] =
    useState(false);
  const register = useAuth((state) => state.register)
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const { openDialog } = usePopupDialog();

  const togglePasswordVisibility = () => setPasswordIsVisible(prev => !prev);
  const toggleConfirmPasswordVisibility = () =>
    setConfirmPasswordIsVisible(prev => !prev);

  const clearForm = () => {
    setFetchedUser(null);
    setStudentId('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleBlurStudentId = async () => {
    if (studentId.length !== 10) {
      openDialog(
        'Invalid Student ID',
        'Please enter a valid 10-digit student ID.',
        clearForm,
      );

      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/student/status/${studentId}`,
      );

      if (res.ok) {
        const data = await res.json();

        setFetchedUser(data.user);
      } else {
        const errorData = await res.json();
        const errorText = errorData.message;

        openDialog(
          '',
          errorText || 'No student found with this ID.',
          clearForm,
        );
      }
    } catch {
      openDialog(
        'Fetch Error',
        'Unable to verify student ID. Please try again later.',
        clearForm,
      );
    }
  };

  const handleRegister = async () => {
    if (!studentId || !selectedProvince || !password || !confirmPassword) {
      openDialog("Incomplete", "Please complete all fields");
      return;
    }

    if (password !== confirmPassword) {
      openDialog("Password Mismatch", "Passwords do not match");
      return;
    }

    const success = await register({
      username: studentId,
      password,
      confirmPassword,
      metadata: { secret: selectedProvince },
    });

    if (success) {
      openDialog("Success", "You have successfully registered.", () => {
        clearForm();
        onOpenChange();
      });
    } else {
      openDialog("Error", "Registration failed. Please try again.");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      clearForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await fetch('/data/province.json');
        const data = await res.json();

        setProvinces(data);
      } catch (err) {
        console.error('Failed to load province list', err);
      }
    };

    loadProvinces();
  }, []);

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      placement="bottom"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        <ModalHeader className="justify-center">Register</ModalHeader>
        <ModalBody>
          <Input
            label="Student ID"
            labelPlacement="inside"
            placeholder="e.g. 6531503201"
            size="lg"
            startContent={<User2 className="text-default-400" />}
            value={studentId}
            onBlur={handleBlurStudentId}
            onValueChange={setStudentId}
          />
          <Input
            isDisabled
            label="Name"
            labelPlacement="inside"
            size="lg"
            startContent={<User2 className="text-default-400" />}
            value={
              fetchedUser
                ? `${fetchedUser.name.first} ${fetchedUser.name.middle ?? ''} ${fetchedUser.name.last}`.trim()
                : ''
            }
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
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
            onValueChange={setPassword}
          />
          <Input
            endContent={
              <button
                aria-label="Toggle password visibility"
                className="focus:outline-none"
                type="button"
                onClick={toggleConfirmPasswordVisibility}
              >
                {isConfirmPasswordVisible ? (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeClosed className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            label="Confirm Password"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            value={confirmPassword}
            onValueChange={setConfirmPassword}
          />
          <Select
            label="Province"
            labelPlacement="inside"
            placeholder="Select province"
            selectedKeys={selectedProvince ? [selectedProvince] : []}
            onChange={(e) => setSelectedProvince(e.target.value)}
          >
            {provinces.map(province => (
              <SelectItem key={province.name_th}>{province.name_th}</SelectItem>
            ))}
          </Select>

        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onOpenChange}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleRegister}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
