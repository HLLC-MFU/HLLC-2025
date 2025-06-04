import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Divider, Card } from "@heroui/react";
import { ActivityType } from "@/types/activities";
import { createRef, useState } from "react";
import { CheckCircle, Image } from "lucide-react";

interface ActivityTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (activityType: Partial<ActivityType>) => void;
    mode: 'add' | 'edit';
    activityType?: ActivityType;
}

export function ActivityTypeModal({ isOpen, onClose, onSubmit, mode, activityType }: ActivityTypeModalProps) {
    const [bannerPhoto, setBannerPhoto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const fileInputRef = createRef<HTMLInputElement>();

    const handleFileChange = (file: File) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setBannerPhoto(file);
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;

        if (!name.trim()) return;

        const typeData = new FormData();
        typeData.append('name', name.trim());
        if (bannerPhoto) {
            typeData.append('photo[bannerPhoto]', bannerPhoto);
        }

        onSubmit(typeData as any);
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="2xl"
        >
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1">
                        {mode === 'add' ? 'Add New Activity Type' : 'Edit Activity Type'}
                    </ModalHeader>
                    <Divider />
                    <ModalBody className="gap-4">
                        <Input
                            autoFocus
                            label="Type Name"
                            name="name"
                            placeholder="Enter activity type name"
                            defaultValue={activityType?.name || ''}
                            isRequired
                        />

                        <div className="space-y-4">
                            <h3 className="font-semibold capitalize text-lg">Banner Photo</h3>
                            <div className="relative max-w-xs mx-auto">
                                <label htmlFor="upload-banner" className="cursor-pointer block">
                                    <img
                                        src={previewUrl || (activityType?.photo?.bannerPhoto 
                                            ? `http://localhost:8080/uploads/${activityType.photo.bannerPhoto}`
                                            : "http://localhost:8080/uploads/default-banner.jpg")}
                                        alt="Banner"
                                        className="w-full rounded-xl shadow-lg"
                                    />
                                </label>
                                <input
                                    id="upload-banner"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileChange(file);
                                    }}
                                    className="hidden"
                                />
                            </div>
                            {bannerPhoto && (
                                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>📁 {bannerPhoto.name}</span>
                                </div>
                            )}
                        </div>
                    </ModalBody>
                    <Divider />
                    <ModalFooter>
                        <Button 
                            variant="light" 
                            onPress={onClose}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary"
                            type="submit"
                        >
                            {mode === 'add' ? 'Create Type' : 'Save Changes'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
} 