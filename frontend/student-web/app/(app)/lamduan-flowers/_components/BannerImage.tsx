'use client';

import { Image } from '@heroui/react';

export default function BannerImage() {
    return (
        <div className="w-full h-32 rounded-2xl bg-white/20 backdrop-blur-md overflow-hidden mb-4 shadow-lg border border-white/20">
            <Image
                src="lobby_6.jpeg"
                alt="Banner"
                className="w-full h-full object-cover"
            />
        </div>
    );
}
