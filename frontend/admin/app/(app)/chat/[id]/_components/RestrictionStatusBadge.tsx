import { Ban, MicOff } from "lucide-react";
import { RestrictionStatus } from "@/types/room";

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
                <span className="inline-flex items-start gap-1 px-2 py-1 rounded text-gray-700 text-xs">
                    <Ban size={10}/>
                    Banned
                    {showExpiry && banExpiry && (
                        <span>
                            ({new Date(banExpiry).toLocaleDateString()})
                        </span>
                    )}
                </span>
            )}
            {isMuted && (
                <span className="inline-flex items-start gap-1 px-2 py-1 rounded text-gray-700 text-xs">
                    <MicOff size={10} />
                    Muted
                    {showExpiry && muteExpiry && (
                        <span>
                            ({new Date(muteExpiry).toLocaleDateString()})
                        </span>
                    )}
                </span>
            )}
        </div>
    );
} 