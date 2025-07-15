import { ScrollShadow } from "@heroui/react";

export default function EvouchersSkeleton() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            <ScrollShadow className="h-[600px] overflow-y-auto pb-10" size={40} hideScrollBar>
                <div className="grid grid-cols-2 gap-8">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="w-40 h-40 rounded-3xl shadow-xl bg-white/20 backdrop-blur-md border border-white/10 bg-gradient-to-b from-transparent via-black/0 to-black/40"
                        />
                    ))}
                </div>
            </ ScrollShadow>
        </div>
    )
}