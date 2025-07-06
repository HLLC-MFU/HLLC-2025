"use client";

import { Switch, Tooltip } from "@heroui/react";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface StatusToggleProps {
    isActive: boolean;
    onToggle: () => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
    className?: string;
    roomName?: string;
    requireConfirmation?: boolean;
}

export function StatusToggle({ 
    isActive, 
    onToggle, 
    disabled = false, 
    size = "md",
    showIcon = true,
    className = "",
    roomName = "Room",
    requireConfirmation = true
}: StatusToggleProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleToggle = async () => {
        if (disabled || isLoading) return;
        
        if (requireConfirmation) {
            setShowConfirmation(true);
            return;
        }
        
        await executeToggle();
    };

    const executeToggle = async () => {
        setIsLoading(true);
        try {
            await onToggle();
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        setShowConfirmation(false);
        await executeToggle();
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    const getSizeClasses = () => {
        switch (size) {
            case "sm":
                return "scale-75";
            case "lg":
                return "scale-110";
            default:
                return "";
        }
    };

    return (
        <>
            <div className={`flex items-center gap-2 ${className}`}>
                {showIcon && (
                    <div className={`flex items-center justify-center ${getSizeClasses()}`}>
                        {isActive ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                            <XCircle className="w-4 h-4 text-default-400" />
                        )}
                    </div>
                )}
                
                <Tooltip 
                    content={isActive ? "Deactivate Room" : "Activate Room"}
                    placement="top"
                    delay={500}
                >
                    <Switch
                        isSelected={isActive}
                        onValueChange={handleToggle}
                        isDisabled={disabled || isLoading}
                        size={size}
                        color={isActive ? "success" : "default"}
                        classNames={{
                            wrapper: "group-data-[selected=true]:bg-success",
                            thumb: "group-data-[selected=true]:bg-white",
                        }}
                        startContent={isActive ? undefined : <XCircle className="w-3 h-3" />}
                        endContent={isActive ? <CheckCircle className="w-3 h-3" /> : undefined}
                    />
                </Tooltip>
                
                {isLoading && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
            </div>
        </>
    );
} 