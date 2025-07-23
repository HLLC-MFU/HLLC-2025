import { Ban, MicOff } from "lucide-react";
import { RestrictionStatus } from "@/types/room";

type RestrictionStatusBadgeProps = {
    restrictionStatus?: RestrictionStatus;
    showExpiry?: boolean;
};

export function RestrictionStatusBadge({ restrictionStatus, showExpiry = false }: RestrictionStatusBadgeProps) {
    if (!restrictionStatus) return null;
    const { isBanned, isMuted, banExpiry, muteExpiry } = restrictionStatus;
    const now = new Date();
    const isBanActive = isBanned && (!banExpiry || new Date(banExpiry) > now);
    const isMuteActive = isMuted && (!muteExpiry || new Date(muteExpiry) > now);
    if (!isBanActive && !isMuteActive) return null;
    return (
        <div className="flex gap-2 mt-1 justify-start text-center">
            {isBanActive && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-700 text-xs">
                    <Ban size={10}/>
                    Banned
                    {showExpiry && banExpiry && (
                        <div className="text-center">
                            ({new Date(banExpiry).toLocaleDateString()})
                        </div>
                    )}
                </div>
            )}
            {isMuteActive && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-yellow-700 text-xs">
                    <MicOff size={10} />
                    Muted
                    {showExpiry && muteExpiry && (
                        <div className="text-center">
                            ({new Date(muteExpiry).toLocaleDateString()})
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 