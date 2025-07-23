'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { StatusModal } from './_components/StatusModal';

export default function LamduanOrigamiPage() {
    const { user, fetchUser } = useProfile();

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
    const [activityStatus, setActivityStatus] = useState<'not-started' | 'ended' | 'active'>('active');
    const [statusModalVisible, setStatusModalVisible] = useState(true);

    const originalRef = useRef<any>(null);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        if (!lamduanSetting.length) return;

        const { startAt, endAt } = lamduanSetting[0];
        const now = new Date();
        const start = new Date(startAt);
        const end = new Date(endAt);

        if (now < start) {
            setActivityStatus('not-started');
            setStatusModalVisible(true);
        } else if (now > end) {
            setActivityStatus('ended');
            setStatusModalVisible(true);
        } else {
            setActivityStatus('active');
            setStatusModalVisible(false);
        }
    }, [lamduanSetting]);

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

    const isChanged = useMemo(() => {
        if (!hasSubmitted || !originalRef.current) return true;

        const origin = originalRef.current;
        const isCommentChanged = comment.trim() !== (origin.comment || '').trim();
        const isImageChanged = image && !imagePreview?.includes(origin.photo);

        return isCommentChanged || isImageChanged;
    }, [comment, image, imagePreview, hasSubmitted]);

    const handleSubmit = async () => {
        if (!user?._id || !lamduanSetting?.[0]?._id)
            return addToast({ title: 'Server error, please contact admin.', color: 'danger' });
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
                    addToast({ title: 'Submit Lamduan successfully', color: 'success' });
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
            <div className="w-full max-w-full mx-auto space-y-6 md:flex md:space-y-0 md:space-x-6 md:max-w-7xl">
                <div className="md:flex-1 space-y-6">
                    <div className="w-full">
                        <BannerImage />
                    </div>

                    <Card className="bg-black/40 border border-white/20 backdrop-blur-lg rounded-2xl shadow-xl">
                        <CardBody className="space-y-4">
                            <h1 className="text-xl font-semibold text-white">Lamduan Flower</h1>
                            <p className="text-white/80 text-sm">
                                {lamduanSetting[0]?.description?.en || 'Loading...'}
                            </p>
                            <MediaCard />
                        </CardBody>
                    </Card>
                </div>

                <div className="md:flex-[0.6]">
                    <Card className="bg-black/40 border border-white/20 backdrop-blur-lg rounded-2xl shadow-xl">
                        <CardBody className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">Upload Lamduan</h2>

                            <div className="flex items-center justify-center">
                                {imagePreview ? (
                                    <Image
                                        src={imagePreview}
                                        alt="preview"
                                        width="full"
                                        height="full"
                                        className="w-full rounded-xl object-contain max-h-[300px] md:max-h-[400px] lg:max-h-[600px] xl:max-h-[70vh] cursor-pointer"
                                        onClick={() => {
                                            if (activityStatus !== 'active') {
                                                setStatusModalVisible(true);
                                            } else {
                                                setSelectPhotoOpen(true);
                                            }
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="w-full bg-white/5 border border-white/20 rounded-xl h-40 flex items-center justify-center text-white cursor-pointer"
                                        onClick={() => {
                                            if (activityStatus !== 'active') {
                                                setStatusModalVisible(true);
                                            } else {
                                                setSelectPhotoOpen(true);
                                            }
                                        }}
                                    >
                                        Upload Picture
                                    </div>
                                )}
                            </div>

                            <Textarea
                                label="Message"
                                placeholder="Say to yourself in the future..."
                                className="text-white"
                                value={comment}
                                onChange={(e) => setComment(e.target.value.slice(0, 144))}
                                isDisabled={activityStatus !== 'active'}
                            />

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/70">{comment.length} / 144</span>
                                <Button
                                    color="primary"
                                    onPress={() => setConfirmOpen(true)}
                                    isDisabled={ loading || (!comment && !image && !imagePreview) || (hasSubmitted && !isChanged) || activityStatus !== 'active'}
                                >
                                    {loading ? <Spinner size="sm" /> : hasSubmitted ? 'Save' : 'Submit'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

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

            <TutorialModal isOpen={false} onClose={() => { }} photoUrl={null} />

            <StatusModal
                isVisible={statusModalVisible}
                onClose={() => setStatusModalVisible(false)}
                status={activityStatus}
            />
        </ScrollShadow>
    );

}