import { ScrollShadow } from "@heroui/react";

export default function EvouchersSkeleton() {
    return (
        <div className="flex flex-col h-full gap-4 animate-pulse">
            <ScrollShadow className="h-[90%] overflow-y-auto pb-10" size={40} hideScrollBar>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="aspect-square rounded-3xl shadow-xl bg-white/20 backdrop-blur-md border border-white/10 bg-gradient-to-b from-transparent via-black/0 to-black/40"
                        />
                    ))}
                </div>
            </ ScrollShadow>
        </div>
    )
}