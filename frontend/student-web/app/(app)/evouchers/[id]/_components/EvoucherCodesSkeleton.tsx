import { ScrollShadow } from "@heroui/react";

export default function EvoucherCodesSkeleton() {
    return (
        <div className="flex flex-col h-full animate-pulse">
            <ScrollShadow className="h-[90%] overflow-y-auto pt-6 pb-10" size={40} hideScrollBar>
                <div className="grid justify-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center gap-8">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="w-[320px] h-[110px] rounded-2xl shadow-xl bg-white/20 backdrop-blur-md border border-white/10 bg-gradient-to-b from-transparent via-black/0 to-black/40"
                        />
                    ))}
                </div>
            </ScrollShadow>
        </div>
    )
}