"use client";

import { Switch, Tooltip } from "@heroui/react";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

type StatusToggleProps = {
    isActive: boolean;
    onToggle: () => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
    className?: string;
    roomName?: string;
    requireConfirmation?: boolean;
};

export function StatusToggle({
    isActive,
    onToggle,
    disabled = false,
    size = "md",
    showIcon = true,
    className = "",
    requireConfirmation = true
}: StatusToggleProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleToggle = async () => {
        if (disabled || isLoading) return;
        if (requireConfirmation) return setShowConfirmation(true);
        setIsLoading(true);
        await onToggle();
        setIsLoading(false);
    };

    const handleConfirm = async () => {
        setShowConfirmation(false);
        setIsLoading(true);
        await onToggle();
        setIsLoading(false);
    };

    const handleCancel = () => setShowConfirmation(false);

    const getSizeClasses = (size: string) => ({ sm: "scale-75", lg: "scale-110" }[size] || "");

    return (
        <>
            <div className={`flex items-center gap-2 ${className}`}>
                {showIcon && (
                    <div className={`flex items-center justify-center ${getSizeClasses(size)}`}>
                        {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                )}

                <Tooltip content={isActive ? "Deactivate Room" : "Activate Room"} delay={500} placement="top">
                    <Switch
                        color={isActive ? "success" : "danger"}
                        endContent={isActive && <CheckCircle className="w-3 h-3 text-green-500" />}
                        isDisabled={disabled || isLoading}
                        isSelected={isActive}
                        size={size}
                        startContent={!isActive && <XCircle className="w-3 h-3 text-red-500" />}
                        onValueChange={handleToggle}
                    />
                </Tooltip>

                {isLoading && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
            </div>

            {showConfirmation && (
                <div>
                    <button onClick={handleConfirm}>Confirm</button>
                    <button onClick={handleCancel}>Cancel</button>
                </div>
            )}
        </>
    );
}
