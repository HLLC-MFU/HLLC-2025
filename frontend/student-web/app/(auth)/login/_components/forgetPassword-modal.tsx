import { usePopupDialog } from "@/components/ui/dialog";
import { CheckedUser, Province } from "@/types/user";
import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
} from "@heroui/react";
import { Eye, EyeClosed, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import useAuth from '@/hooks/useAuth';

interface ForgetPasswordModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    user?: CheckedUser;
}

export default function ForgetPasswordModal({
    isOpen,
    onOpenChange,
    user: initiaUser,
}: ForgetPasswordModalProps) {
    const [studentId, setStudentId] = useState(initiaUser?.username ?? "");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setPasswordIsVisible] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [selectedProvince, setSelectedProvince] = useState("");
    const [fetchedUser, setFetchedUser] = useState<CheckedUser | null>(
        initiaUser ?? null
    );
    const [isConfirmPasswordVisible, setConfirmPasswordIsVisible] =
        useState(false);
    const { openDialog } = usePopupDialog();
    const resetPassword = useAuth((state) => state.resetPassword);

    const togglePasswordVisibility = () =>
        setPasswordIsVisible((prev) => !prev);
    const toggleConfirmPasswordVisibility = () =>
        setConfirmPasswordIsVisible((prev) => !prev);

    const clearForm = () => {
        setFetchedUser(null);
        setStudentId("");
        setPassword("");
        setConfirmPassword("");
        setSelectedProvince("");
    };

    const handleBlurStudentId = async () => {
        if (studentId.length !== 10) {
            openDialog("Invalid Student ID", "Please enter a valid 10-digit student ID", clearForm);
            return;
        }

        if (!selectedProvince) {
            openDialog("Missing Province", "Please select your province", clearForm);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-reset-password-eligibility`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: studentId,
                    secret: selectedProvince,
                }),
            });

            const data = await res.json();

            if (res.ok && data?.user) {
                setFetchedUser(data.user);
            } else {
                const msg = data.message || "";
                if (msg === "Invalid secret") {
                    openDialog("Province Mismatch", "The selected province does not match our records.", clearForm);
                } else {
                    openDialog("", msg || "No student found with this ID.", clearForm);
                }
            }

        } catch {
            openDialog("Fetch Error", "Unable to verify student ID. Please try again later.");
        }
    };

    const handleResetPassword = async () => {
        if (!studentId || !selectedProvince || !password || !confirmPassword) {
            openDialog("Incomplete", "Please complete all fields");
            return;
        }

        if (password !== confirmPassword) {
            openDialog("Password Mismatch", "Passwords do not match");
            return;
        }

        const success = await resetPassword({
            username: studentId,
            password,
            confirmPassword,
            metadata: { secret: selectedProvince },
        });

        if (success) {
            openDialog("Success", "Your password has been reset successfully", () => {
                clearForm();
                onOpenChange();
            });
        } else {
            openDialog("Error", "Failed to reset password. Please try again.");
        }
    };

    useEffect(() => {
        if (!isOpen) {
            clearForm();
        }
    }, [isOpen]);

    useEffect(() => {
        setFetchedUser(null);
    }, [studentId, selectedProvince])

    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const res = await fetch("/data/province.json");
                const data = await res.json();
                setProvinces(data);
            } catch (err) {
                console.error("Failed to load province list", err);
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
                <ModalHeader className="justify-center">Forget Password</ModalHeader>
                <ModalBody>
                    <Select
                        label="Province"
                        labelPlacement="inside"
                        placeholder="Select province"
                        selectedKeys={selectedProvince ? [selectedProvince] : []}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                    >
                        {provinces.map((province) => (
                            <SelectItem key={province.name_en}>
                                {province.name_th}
                            </SelectItem>
                        ))}
                    </Select>
                    <Input
                        label="Student ID"
                        labelPlacement="inside"
                        placeholder="e.g. 6731503119"
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
                                ? `${fetchedUser.name.first} ${fetchedUser.name.middle ?? ""} ${fetchedUser.name.last}`.trim()
                                : ""
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
                        label="New Password"
                        type={isPasswordVisible ? "text" : "password"}
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
                        label="Confirm New Password"
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        value={confirmPassword}
                        onValueChange={setConfirmPassword}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onOpenChange}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleResetPassword}>
                        Submit
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
