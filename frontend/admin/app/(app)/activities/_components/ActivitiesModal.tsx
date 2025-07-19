"use client";

import {
    Button,
    Divider,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Textarea,
    Switch,
    Form,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Activities } from "@/types/activities";

type ActivitiesModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData, mode: "add" | "edit") => void;
    mode: "add" | "edit";
    activity?: Activities;
    typeId?: string;
    activityTypes: { _id: string; name: string }[];
};

export default function ActivitiesModal({
    isOpen,
    onClose,
    onSubmit,
    mode,
    activity,
    typeId,
    activityTypes,
}: ActivitiesModalProps) {
    const [nameTh, setNameTh] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [acronym, setAcronym] = useState("");
    const [shortDetailsTh, setShortDetailsTh] = useState("");
    const [shortDetailsEn, setShortDetailsEn] = useState("");
    const [fullDetailsTh, setFullDetailsTh] = useState("");
    const [fullDetailsEn, setFullDetailsEn] = useState("");
    const [type, setType] = useState("");
    const [locationTh, setLocationTh] = useState("");
    const [locationEn, setLocationEn] = useState("");
    const [mapUrl, setMapUrl] = useState("");
    const [isOpenMeta, setIsOpenMeta] = useState(true);
    const [isVisibleMeta, setIsVisibleMeta] = useState(true);
    const [isProgressCount, setIsProgressCount] = useState(true);
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [checkinStartAt, setCheckinStartAt] = useState("");
    const [bannerPhotoFile, setBannerPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        if (mode === "edit" && activity) {
            setNameTh(activity.name?.th ?? "");
            setNameEn(activity.name?.en ?? "");
            setAcronym(activity.acronym ?? "");
            setShortDetailsTh(activity.shortDetails?.th ?? "");
            setShortDetailsEn(activity.shortDetails?.en ?? "");
            setFullDetailsTh(activity.fullDetails?.th ?? "");
            setFullDetailsEn(activity.fullDetails?.en ?? "");
            setType(typeof activity.type === "string" ? activity.type : activity.type?._id ?? "");
            setLocationTh(activity.location?.th ?? "");
            setLocationEn(activity.location?.en ?? "");
            setMapUrl(activity.location?.mapUrl ?? "");
            setIsOpenMeta(activity.metadata?.isOpen ?? true);
            setIsVisibleMeta(activity.metadata?.isVisible ?? true);
            setIsProgressCount(activity.metadata?.isProgressCount ?? true);
            setStartAt(activity.metadata?.startAt?.slice(0, 16) ?? "");
            setEndAt(activity.metadata?.endAt?.slice(0, 16) ?? "");
            setCheckinStartAt(activity.metadata?.checkinStartAt?.slice(0, 16) ?? "");
        } else if (mode === "add") {
            setType(typeId ?? "");
            setNameTh("");
            setNameEn("");
            setAcronym("");
            setShortDetailsTh("");
            setShortDetailsEn("");
            setFullDetailsTh("");
            setFullDetailsEn("");
            setLocationTh("");
            setLocationEn("");
            setMapUrl("");
            setIsOpenMeta(true);
            setIsVisibleMeta(true);
            setIsProgressCount(true);
            setStartAt("");
            setEndAt("");
            setCheckinStartAt("");
            setBannerPhotoFile(null);
        }
    }, [activity, mode, typeId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        formData.append("name[th]", nameTh);
        formData.append("name[en]", nameEn);
        formData.append("acronym", acronym);
        formData.append("shortDetails[th]", shortDetailsTh);
        formData.append("shortDetails[en]", shortDetailsEn);
        formData.append("fullDetails[th]", fullDetailsTh);
        formData.append("fullDetails[en]", fullDetailsEn);
        formData.append("type", type);
        formData.append("location[th]", locationTh);
        formData.append("location[en]", locationEn);
        formData.append("location[mapUrl]", mapUrl);
        formData.append("metadata[isOpen]", String(isOpenMeta));
        formData.append("metadata[isVisible]", String(isVisibleMeta));
        formData.append("metadata[isProgressCount]", String(isProgressCount));
        formData.append("metadata[startAt]", startAt);
        formData.append("metadata[endAt]", endAt);
        formData.append("metadata[checkinStartAt]", checkinStartAt);

        if (bannerPhotoFile) {
            formData.append("photo[bannerPhoto]", bannerPhotoFile);
        }

        onSubmit(formData, mode);
    };

    return (
        <Modal isOpen={isOpen} size="3xl" onClose={onClose}>
            <ModalContent>
                <Form onSubmit={handleSubmit}>
                    <ModalHeader>{mode === "add" ? "Add New Activity" : "Edit Activity"}</ModalHeader>
                    <Divider />
                    <ModalBody className="grid grid-cols-2 gap-4">
                        <Input label="Name (TH)" value={nameTh} onChange={(e) => setNameTh(e.target.value)} required />
                        <Input label="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
                        <Input label="Acronym" value={acronym} onChange={(e) => setAcronym(e.target.value)} required />

                        {/* Type dropdown select */}
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block">Activity Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="">Select type</option>
                                {activityTypes.map((t) => (
                                    <option key={t._id} value={t._id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input label="Location (TH)" value={locationTh} onChange={(e) => setLocationTh(e.target.value)} />
                        <Input label="Location (EN)" value={locationEn} onChange={(e) => setLocationEn(e.target.value)} />
                        <Input label="Map URL" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
                        <Textarea label="Short Detail (TH)" value={shortDetailsTh} onChange={(e) => setShortDetailsTh(e.target.value)} />
                        <Textarea label="Short Detail (EN)" value={shortDetailsEn} onChange={(e) => setShortDetailsEn(e.target.value)} />
                        <Textarea label="Full Detail (TH)" value={fullDetailsTh} onChange={(e) => setFullDetailsTh(e.target.value)} />
                        <Textarea label="Full Detail (EN)" value={fullDetailsEn} onChange={(e) => setFullDetailsEn(e.target.value)} />
                        <Input type="datetime-local" label="Start At" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                        <Input type="datetime-local" label="End At" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                        <Input type="datetime-local" label="Check-in Start At" value={checkinStartAt} onChange={(e) => setCheckinStartAt(e.target.value)} />

                        {/* Upload field */}
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block">Banner Photo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setBannerPhotoFile(e.target.files?.[0] || null)}
                            />
                        </div>

                        <div className="col-span-2 flex gap-6">
                            <Switch isSelected={isOpenMeta} onValueChange={setIsOpenMeta}>Is Open</Switch>
                            <Switch isSelected={isVisibleMeta} onValueChange={setIsVisibleMeta}>Is Visible</Switch>
                            <Switch isSelected={isProgressCount} onValueChange={setIsProgressCount}>Progress Count</Switch>
                        </div>
                    </ModalBody>
                    <Divider />
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit">
                            {mode === "add" ? "Create Activity" : "Save Changes"}
                        </Button>
                    </ModalFooter>
                </Form>
            </ModalContent>
        </Modal>
    );
}
