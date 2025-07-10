import { Badge } from "@heroui/react";
import { Ban, MicOff } from "lucide-react";
import { RestrictionStatus } from "@/types/chat";

type RestrictionStatusBadgeProps = {
    restrictionStatus?: RestrictionStatus;
    showExpiry?: boolean;
};

export function RestrictionStatusBadge({ restrictionStatus, showExpiry = false }: RestrictionStatusBadgeProps) {
    if (!restrictionStatus) return null;

    const { isBanned, isMuted, banExpiry, muteExpiry } = restrictionStatus;

    if (!isBanned && !isMuted) return null;

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {isBanned && (
                <Badge 
                    color="danger" 
                    size="sm" 
                    variant="flat"
                    className="text-xs"
                >
                    <Ban size={10} className="mr-1" />
                    Banned
                    {showExpiry && banExpiry && (
                        <span className="ml-1 text-xs opacity-75">
                            ({new Date(banExpiry).toLocaleDateString()})
                        </span>
                    )}
                </Badge>
            )}
            {isMuted && (
                <Badge 
                    color="warning" 
                    size="sm" 
                    variant="flat"
                    className="text-xs"
                >
                    <MicOff size={10} className="mr-1" />
                    Muted
                    {showExpiry && muteExpiry && (
                        <span className="ml-1 text-xs opacity-75">
                            ({new Date(muteExpiry).toLocaleDateString()})
                        </span>
                    )}
                </Badge>
            )}
        </div>
    );
} 