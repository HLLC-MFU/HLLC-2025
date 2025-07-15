'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Button,
    Card,
    CardBody,
    ScrollShadow,
    Spinner,
    Textarea,
    addToast,
    Image,
} from '@heroui/react';
import BannerImage from './_components/BannerImage';
import { ConfirmModal } from './_components/ConfirmModal';
import MediaCard from './_components/MediaCard';
import TutorialModal from './_components/TutorialModal';
import SelectPhotoModal from './_components/SelectPhotoModal';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';
import { useProfile } from '@/hooks/useProfile';

export default function LamduanOrigamiPage() {
    const { user } = useProfile();
    const {
        flowers,
        lamduanSetting,
        createLamduanFlowers,
        updateLamduanFlowers,
    } = useLamduanFlowers();

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectPhotoOpen, setSelectPhotoOpen] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const originalRef = useRef<any>(null);

    useEffect(() => {
        if (!user?._id || !flowers.length) return;

        const existing = flowers.find((f) => f.user._id === user._id);
        if (existing) {
            originalRef.current = existing;
            setComment(existing.comment);
            setImagePreview(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${existing.photo}`);
            setHasSubmitted(true);
        }
    }, [flowers, user]);

    const handleSubmit = async () => {
        if (!user?._id || !lamduanSetting?.[0]?._id) return;
        if (!image && !imagePreview)
            return addToast({ title: 'Please select an image.', color: 'danger' });

        setLoading(true);

        const formData = new FormData();
        if (image) formData.append('photo', image);
        formData.append('comment', comment || ' ');
        formData.append('user', user._id);
        formData.append('setting', lamduanSetting[0]._id);

        try {
            if (!originalRef.current) {
                const res = await createLamduanFlowers(formData);
                if (res?.data?._id) {
                    originalRef.current = res.data;
                    setHasSubmitted(true);
                    addToast({ title: 'Created successfully', color: 'success' });
                }
            } else {
                await updateLamduanFlowers(originalRef.current._id, formData);
                addToast({ title: 'Updated successfully', color: 'success' });
            }
        } catch (err) {
            console.error(err);
            addToast({ title: 'Failed to submit', color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollShadow className="w-full h-full px-4">
            <BannerImage />

            <div className="grid grid-row-2 gap-4">
                <Card className="bg-black/20 border border-white/20 backdrop-blur-lg rounded-2xl shadow-xl">
                    <CardBody className="space-y-4">
                        <h1 className="text-xl font-semibold text-white">Lamduan Origami</h1>
                        <p className="text-white/80 text-sm">
                            Enhance your knowledge of the university through the origami Lamduan flower. 
                            Additionally, immerse yourself in instructional origami videos that showcase the important information about the university.
                        </p>
                        <MediaCard />
                    </CardBody>
                </Card>

                <Card className="bg-black/20 border border-white/20 backdrop-blur-lg rounded-2xl shadow-xl">
                    <CardBody className="space-y-4">
                        <h2 className="text-lg font-semibold text-white">Upload Lamduan</h2>
                        <div>
                            {imagePreview ? (
                                <Image
                                    src={imagePreview}
                                    alt="preview"
                                    width={800}
                                    height={450}
                                    className="w-full rounded-xl object-contain max-h-[300px] cursor-pointer"
                                    onClick={() => setSelectPhotoOpen(true)}
                                />
                            ) : (
                                <div
                                    className="bg-white/5 border border-white/20 rounded-xl h-40 flex items-center justify-center text-white cursor-pointer"
                                    onClick={() => setSelectPhotoOpen(true)}
                                >
                                    Upload Picture
                                </div>
                            )}
                        </div>

                        <Textarea
                            label="Message"
                            placeholder="Type message..."
                            className="text-white"
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 144))}
                        />

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-white/70">{comment.length} / 144</span>
                            <Button
                                color="primary"
                                onPress={() => setConfirmOpen(true)}
                                isDisabled={!comment || (!image && !imagePreview) || loading}
                            >
                                {loading ? <Spinner size="sm" /> : hasSubmitted ? 'Save' : 'Submit'}
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                <ConfirmModal
                    isVisible={confirmOpen}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={() => {
                        setConfirmOpen(false);
                        handleSubmit();
                    }}
                    mode={hasSubmitted ? 'save' : 'submit'}
                />

                <SelectPhotoModal
                    isOpen={selectPhotoOpen}
                    onClose={() => setSelectPhotoOpen(false)}
                    onSelect={(file, preview) => {
                        setImage(file);
                        setImagePreview(preview);
                        setSelectPhotoOpen(false);
                    }}
                />

                <TutorialModal
                    isOpen={false}
                    onClose={() => { }}
                    photoUrl={null}
                />
            </div>
        </ScrollShadow>
    );
}
