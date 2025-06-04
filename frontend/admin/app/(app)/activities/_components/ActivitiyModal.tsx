import { Activities } from "@/types/activities";
import { Input, ModalBody, Modal, ModalContent, ModalHeader } from "@heroui/react";
import { useEffect, useState } from "react";

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (activity: Partial<Activities>, mode: "add" | "edit") => void;
    activity?: Activities;
    mode: "add" | "edit";
}

export function ActivityModal({
    isOpen: isOpenModal,
    onClose,
    onSuccess,
    activity,
    mode
}: ActivityModalProps) {

    const [nameEn, setNameEn] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [acronym, setAcronym] = useState("");
    const [fullDetailsEn, setFullDetailsEn] = useState("");
    const [fullDetailsTh, setFullDetailsTh] = useState("");
    const [shortDetailsEn, setShortDetailsEn] = useState("");
    const [shortDetailsTh, setShortDetailsTh] = useState("");
    const [locationEn, setLocationEn] = useState("");
    const [locationTh, setLocationTh] = useState("");
    const [bannerPhoto, setBannerPhoto] = useState("");
    const [logoPhoto, setLogoPhoto] = useState("");
    const [isOpen, setIsOpen] = useState(activity?.metadata?.isOpen || true);
    const [isProgressCount, setIsProgressCount] = useState(activity?.metadata?.isProgressCount || true);
    const [isVisible, setIsVisible] = useState(activity?.metadata?.isVisible || true);
    const [scopeMajor, setScopeMajor] = useState(activity?.metadata?.scope?.major || []);
    const [scopeSchool, setScopeSchool] = useState(activity?.metadata?.scope?.school || []);
    const [scopeUser, setScopeUser] = useState(activity?.metadata?.scope?.user || []);

    useEffect(() => {
        if (activity) {
            setNameEn(activity.name?.en || "");
            setNameTh(activity.name?.th || "");
            setAcronym(activity.acronym || "");
            setFullDetailsEn(activity.fullDetails?.en || "");
            setFullDetailsTh(activity.fullDetails?.th || "");
            setShortDetailsEn(activity.shortDetails?.en || "");
            setShortDetailsTh(activity.shortDetails?.th || "");
            setLocationEn(activity.location?.en || "");
            setLocationTh(activity.location?.th || "");
        }
    }, [activity]);

    const handleSubmit = () => {
        if (!nameEn.trim() || !nameTh.trim()) return;

        const updatedActivity: Partial<Activities> = {
            ...activity,
            name: { en: nameEn.trim(), th: nameTh.trim() },
            acronym: acronym.trim() || nameEn.substring(0, 3).toUpperCase(),
            fullDetails: { en: fullDetailsEn.trim(), th: fullDetailsTh.trim() },
            shortDetails: { en: shortDetailsEn.trim(), th: shortDetailsTh.trim() },
            location: { en: locationEn.trim(), th: locationTh.trim() },
            photo: {
                bannerPhoto: bannerPhoto,
                logoPhoto: logoPhoto
            },
            metadata: {
                isOpen: isOpen,
                isProgressCount: isProgressCount,
                isVisible: isVisible,
                scope: {
                    major: scopeMajor,
                    school: scopeSchool,
                    user: scopeUser
                }
            }
        }

        onSuccess(updatedActivity, mode);
        onClose();
    }

    return (
        <Modal isOpen={isOpenModal} onClose={onClose}>
            <ModalContent>
                <ModalHeader>
                    {mode === "add" ? "Add New Activity" : "Edit Activity"}
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Name"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                        />
                        <Input
                            label="Name"
                            value={nameTh}
                            onChange={(e) => setNameTh(e.target.value)}
                        />
                        <Input
                            label="Acronym"
                            value={acronym}
                            onChange={(e) => setAcronym(e.target.value)}
                        />
                        <Input
                            label="Full Details"
                            value={fullDetailsEn}
                            onChange={(e) => setFullDetailsEn(e.target.value)}
                        />
                        <Input
                            label="Full Details"
                            value={fullDetailsTh}
                            onChange={(e) => setFullDetailsTh(e.target.value)}
                        />
                        <Input
                            label="Short Details"
                            value={shortDetailsEn}
                            onChange={(e) => setShortDetailsEn(e.target.value)}
                        />
                        <Input
                            label="Short Details"
                            value={shortDetailsTh}
                            onChange={(e) => setShortDetailsTh(e.target.value)}
                        />
                        <Input
                            label="Location"
                            value={locationEn}
                            onChange={(e) => setLocationEn(e.target.value)}
                        />
                        <Input
                            label="Location"
                            value={locationTh}
                            onChange={(e) => setLocationTh(e.target.value)}
                        />
                        <Input
                            label="Photo Icon"
                            value={activity?.photo.logoPhoto}
                            onChange={(e) => setLogoPhoto(e.target.value)}
                        />
                        <Input
                            label="Banner Photo"
                            value={activity?.photo.bannerPhoto}
                            onChange={(e) => setBannerPhoto(e.target.value)}
                        />
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}