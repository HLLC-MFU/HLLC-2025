import { Button } from '@heroui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Appearance } from '@/types/appearance';

interface AppearanceHeaderProps {
    appearance: Appearance;
}

export function AppearanceHeader({ appearance }: AppearanceHeaderProps) {
    const router = useRouter();

    return (
        <div>
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="flat"
                        startContent={<ArrowLeft className="w-4 h-4" />}
                        onPress={() => router.back()}
                        className="hover:bg-gray-100 transition-colors"
                    >
                        Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${appearance?.colors?.primary}, ${appearance?.colors?.secondary})` }}
                        >
                            {appearance?.school?.acronym ?? "N/A"}
                        </div>
                        <div className='flex flex-col items-start'>
                            <h1 className="text-2xl font-bold">
                                {appearance?.school?.name?.en ?? "Unnamed School"}
                            </h1>
                            <p className="text-sm">Appearance Settings</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 