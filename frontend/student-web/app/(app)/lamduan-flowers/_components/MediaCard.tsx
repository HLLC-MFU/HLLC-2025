'use client';

import { useState } from 'react';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';
import TutorialModal from './TutorialModal';
import { Button } from '@heroui/react';

export default function MediaCard() {
    const [isModalVisible, setModalVisible] = useState(false);
    const { lamduanSetting } = useLamduanFlowers();
    const latestSetting = lamduanSetting?.[0];

    const extractYouTubeId = (url: string) => {
        const regex = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&\n?#]+)/;
        const match = url?.match(regex);
        return match ? match[1] : null;
    };

    const videoId = latestSetting?.tutorialVideo
        ? extractYouTubeId(latestSetting.tutorialVideo)
        : null;

    const tutorialPhotoUrl = latestSetting?.tutorialPhoto
        ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${latestSetting.tutorialPhoto}`
        : null;

    return (
        <div className="w-full space-y-4">
            {videoId ? (
                <div className="w-full aspect-video overflow-hidden rounded-xl shadow-lg">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full"
                        allowFullScreen
                    />
                </div>
            ) : (
                <p className="text-center text-white/80">No Video Found</p>
            )}

            <div className="flex justify-center">
                <Button
                    onPress={() => setModalVisible(true)}
                    className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white text-white hover:bg-white/20 transition"
                >
                    Lamduan Tutorial
                </Button>
            </div>

            <TutorialModal
                isOpen={isModalVisible}
                onClose={() => setModalVisible(false)}
                photoUrl={tutorialPhotoUrl}
            />
        </div>
    );
}
