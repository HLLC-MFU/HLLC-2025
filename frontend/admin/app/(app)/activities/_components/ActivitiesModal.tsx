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
    Select,
    SelectItem,
    DatePicker,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Activities } from "@/types/activities";
import { School } from "@/types/school";
import { Major } from "@/types/major";
import { User } from "@/types/user";
import ImageInput from "@/components/ui/imageInput";
import { fromDate } from "@internationalized/date";

type ActivitiesModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData, mode: "add" | "edit") => void;
    mode: "add" | "edit";
    activity?: Activities;
    typeId?: string;
    activityTypes: { _id: string; name: string }[];
    schools: School[]
    majors: Major[]
    users: User[]
};

export default function ActivitiesModal({
    isOpen,
    onClose,
    onSubmit,
    mode,
    activity,
    typeId,
    activityTypes,
    schools,
    majors,
    users,
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
    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);
    const [checkinStartAt, setCheckinStartAt] = useState<Date | null>(null);
    const [bannerPhotoFile, setBannerPhotoFile] = useState<File | null>(null);
    const [bannerPhotoUrl, setBannerPhotoUrl] = useState<string | null>(null);
    const [logoPhotoFile, setLogoPhotoFile] = useState<File | null>(null);
    const [logoPhotoUrl, setLogoPhotoUrl] = useState<string | null>(null);
    const [scopeMajor, setScopeMajor] = useState<string[]>([]);
    const [scopeSchool, setScopeSchool] = useState<string[]>([]);
    const [scopeUser, setScopeUser] = useState<string[]>([]);
    const [showImageError, setShowImageError] = useState(false);

    const toLocalDatetime = (utcString: string | undefined | null) => {
        if (!utcString) return "";
        const date = new Date(utcString);
        date.setHours(date.getHours() + 7);
        return date.toISOString().slice(0, 16);
    };

    const parseISOToDate = (isoStr?: string | null) => {
        if (!isoStr) return null;
        const d = new Date(isoStr);
        // ถ้าต้องปรับเวลา timezone เพิ่ม 7 ชม. เช่นในเดิม ก็ใส่
        // d.setHours(d.getHours() + 7);
        return d;
    };

    useEffect(() => {
        if (mode === "edit" && activity) {
            setNameTh(activity.name?.th ?? "");
            setNameEn(activity.name?.en ?? "");
            setAcronym(activity.acronym ?? "");
            setShortDetailsTh(activity.shortDetails?.th ?? "");
            setShortDetailsEn(activity.shortDetails?.en ?? "");
            setFullDetailsTh(activity.fullDetails?.th ?? "");
            setFullDetailsEn(activity.fullDetails?.en ?? "");
            setType(
                typeof activity.type === "string"
                    ? activityTypes.find((t) => t.name === activity.type)?._id ?? ""
                    : activity.type?._id ?? ""
            );
            setLocationTh(activity.location?.th ?? "");
            setLocationEn(activity.location?.en ?? "");
            setMapUrl(activity.location?.mapUrl ?? "");
            setIsOpenMeta(activity.metadata?.isOpen ?? true);
            setIsVisibleMeta(activity.metadata?.isVisible ?? true);
            setIsProgressCount(activity.metadata?.isProgressCount ?? true);
            setScopeMajor(
                (activity.metadata?.scope?.major ?? []).map((m) =>
                    typeof m === "string" ? m : m._id
                )
            );
            setScopeSchool(
                (activity.metadata?.scope?.school ?? []).map((s) =>
                    typeof s === "string" ? s : s._id
                )
            );
            setScopeUser(
                (activity.metadata?.scope?.user ?? []).map((u) =>
                    typeof u === "string" ? u : u._id
                )
            );
            setStartAt(parseISOToDate(activity.metadata?.startAt) ?? null);
            setEndAt(parseISOToDate(activity.metadata?.endAt) ?? null);
            setCheckinStartAt(parseISOToDate(activity.metadata?.checkinStartAt) ?? null);
            setBannerPhotoFile(null);
            setBannerPhotoUrl(
                activity.photo?.bannerPhoto
                    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}`
                    : null
            );
            setLogoPhotoFile(null);
            setLogoPhotoUrl(
                activity.photo?.logoPhoto
                    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.logoPhoto}`
                    : null
            );
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
            setScopeMajor([]);
            setScopeSchool([]);
            setScopeUser([]);
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            setStartAt(now);
            setEndAt(tomorrow);
            setCheckinStartAt(now);
            setBannerPhotoFile(null);
            setLogoPhotoFile(null);
            setBannerPhotoUrl(null);
            setLogoPhotoUrl(null);
        }
    }, [activity, mode, typeId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        if (mode === "add" && (!bannerPhotoFile || !logoPhotoFile)) {
            setShowImageError(true);
            return;
        }

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
        formData.append("metadata[scope][major][]", scopeMajor.join(" , "))
        formData.append("metadata[scope][school][]", scopeSchool.join(" , "))
        formData.append("metadata[scope][user][]", scopeUser.join(" , "))

        if (startAt) formData.append("metadata[startAt]", startAt.toISOString());
        if (endAt) formData.append("metadata[endAt]", endAt.toISOString());
        if (checkinStartAt) formData.append("metadata[checkinStartAt]", checkinStartAt.toISOString());

        if (bannerPhotoFile) {
            formData.append("photo[bannerPhoto]", bannerPhotoFile);
        }
        if (logoPhotoFile) {
            formData.append("photo[logoPhoto]", logoPhotoFile);
        }

        onSubmit(formData, mode);
    };

    return (
        <Modal isOpen={isOpen} size="3xl" onClose={onClose} isDismissable={false} >
            <ModalContent className="max-w-[60vw]">
                <Form onSubmit={handleSubmit}>
                    <ModalHeader>{mode === "add" ? "Add New Activity" : "Edit Activity"}</ModalHeader>
                    <Divider />
                    <ModalBody className="grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto w-full p-4 flex">
                        <div className="space-y-8 flex-col w-full">
                            {/* Basic Information Section */}
                            <div className="space-y-4 w-full flex-col">
                                <h3 className="text-lg font-medium text-foreground-700 border-b border-divider pb-2">
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        isRequired
                                        label="Name (English)"
                                        value={nameEn}
                                        onChange={(e) => setNameEn(e.target.value)}
                                        required
                                        variant="bordered"
                                    />
                                    <Input
                                        isRequired
                                        label="Name (Thai)"
                                        value={nameTh}
                                        onChange={(e) => setNameTh(e.target.value)}
                                        required
                                        variant="bordered"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        isRequired
                                        label="Acronym"
                                        value={acronym}
                                        onChange={(e) => setAcronym(e.target.value)}
                                        required
                                        variant="bordered"
                                    />
                                    <div className="flex items-center">
                                        <div className="flex justify-between gap-8">
                                            <div className="flex flex-col items-center">
                                                <Switch isSelected={isOpenMeta} onValueChange={setIsOpenMeta} size="md" />
                                                <span className="text-md mt-1">Open</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <Switch isSelected={isVisibleMeta} onValueChange={setIsVisibleMeta} size="md" />
                                                <span className="text-md mt-1">Visible</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <Switch isSelected={isProgressCount} onValueChange={setIsProgressCount} size="md" />
                                                <span className="text-md mt-1">Count</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-foreground-700 border-b border-divider pb-2">Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Textarea
                                        isRequired
                                        label="Short Details (English)"
                                        value={shortDetailsEn}
                                        onChange={(e) => setShortDetailsEn(e.target.value)}
                                        variant="bordered"
                                        minRows={3}
                                    />
                                    <Textarea
                                        isRequired
                                        label="Short Details (Thai)"
                                        value={shortDetailsTh}
                                        onChange={(e) => setShortDetailsTh(e.target.value)}
                                        variant="bordered"
                                        minRows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Textarea
                                        isRequired
                                        label="Full Details (English)"
                                        value={fullDetailsEn}
                                        onChange={(e) => setFullDetailsEn(e.target.value)}
                                        variant="bordered"
                                        minRows={4}
                                    />
                                    <Textarea
                                        isRequired
                                        label="Full Details (Thai)"
                                        value={fullDetailsTh}
                                        onChange={(e) => setFullDetailsTh(e.target.value)}
                                        variant="bordered"
                                        minRows={4}
                                    />
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-foreground-700 border-b border-divider pb-2">Location</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        isRequired
                                        label="Location (English)"
                                        value={locationEn}
                                        onChange={(e) => setLocationEn(e.target.value)}
                                        variant="bordered"
                                    />
                                    <Input
                                        isRequired
                                        label="Location (Thai)"
                                        value={locationTh}
                                        onChange={(e) => setLocationTh(e.target.value)}
                                        variant="bordered"
                                    />
                                </div>
                                <Input
                                    isRequired
                                    label="Map URL"
                                    value={mapUrl}
                                    onChange={(e) => setMapUrl(e.target.value)}
                                    variant="bordered"
                                    className="w-full"
                                />
                            </div>

                            {/* Schedule Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-foreground-700 border-b border-divider pb-2">Schedule</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <DatePicker
                                        isRequired
                                        label="Start Date & Time"
                                        value={startAt ? fromDate(startAt, "Asia/Bangkok") : undefined}
                                        onChange={(date) => setStartAt(date?.toDate() ?? startAt)}
                                    />
                                    <DatePicker
                                        label="Check-in Start"
                                        value={checkinStartAt ? fromDate(checkinStartAt, "Asia/Bangkok") : undefined}
                                        onChange={(date) => setCheckinStartAt(date?.toDate() ?? checkinStartAt)}
                                    />
                                    <DatePicker
                                        isRequired
                                        label="End Date & Time"
                                        value={endAt ? fromDate(endAt, "Asia/Bangkok") : undefined}
                                        onChange={(date) => setEndAt(date?.toDate() ?? endAt)}
                                    />
                                </div>
                            </div>

                            {/* Scope Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-foreground-700 border-b border-divider pb-2">Access Scope</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Select
                                        label="Scope Major"
                                        selectionMode="multiple"
                                        selectedKeys={new Set<string>(scopeMajor)}
                                        onSelectionChange={(keys) => {
                                            setScopeMajor(Array.from(keys as Set<string>));
                                        }}

                                        variant="bordered"
                                    >
                                        {majors.map((major) => (
                                            <SelectItem key={major._id}>{major.name.en}</SelectItem>
                                        ))}
                                    </Select>
                                    <Select
                                        label="Scope School"
                                        selectionMode="multiple"
                                        selectedKeys={new Set<string>(scopeSchool)}
                                        onSelectionChange={(keys) => setScopeSchool(Array.from(keys as Set<string>))}
                                        variant="bordered"
                                    >
                                        {schools.map((school) => (
                                            <SelectItem key={school._id}>{school.name.en}</SelectItem>
                                        ))}
                                    </Select>
                                    <Select
                                        label="Scope User"
                                        selectionMode="multiple"
                                        selectedKeys={new Set<string>(scopeUser)}
                                        onSelectionChange={(keys) => setScopeUser(Array.from(keys as Set<string>))}
                                        variant="bordered"
                                    >
                                        {users.map((user) => (
                                            <SelectItem key={user._id}>{user.username || user.username}</SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {/* Images Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-foreground-700 border-b border-divider pb-2">Images</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <ImageInput
                                            title="Upload Banner Photo"
                                            image={activity?.photo?.bannerPhoto || undefined}
                                            onChange={(file) => {
                                                setBannerPhotoFile(file)
                                                setBannerPhotoUrl(URL.createObjectURL(file))
                                            }}
                                            onCancel={() => {
                                                setBannerPhotoFile(null)
                                                setBannerPhotoUrl(null)
                                            }}
                                            fileAccept="image/*"
                                            sizeLimit={1024 * 1024}
                                        />
                                        {showImageError && !bannerPhotoFile && (
                                            <p className="text-sm text-danger">Please upload Banner</p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <ImageInput
                                            title="Upload Logo Photo"
                                            image={activity?.photo?.logoPhoto || undefined}
                                            onChange={(file) => {
                                                setLogoPhotoFile(file)
                                                setLogoPhotoUrl(URL.createObjectURL(file))
                                            }}
                                            onCancel={() => {
                                                setLogoPhotoFile(null)
                                                setLogoPhotoUrl(null)
                                            }}
                                            fileAccept="image/*"
                                            sizeLimit={1024 * 1024}
                                        />
                                        {showImageError && !bannerPhotoFile && (
                                            <p className="text-sm text-danger">Please upload Logo</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <Divider />
                    <ModalFooter className="gap-3">
                        <Button variant="light" onPress={onClose} size="md">
                            Cancel
                        </Button>
                        <Button color="primary" type="submit" size="md">
                            {mode === "add" ? "Create Activity" : "Save Changes"}
                        </Button>
                    </ModalFooter>
                </Form>
            </ModalContent>
        </Modal>
    )
}