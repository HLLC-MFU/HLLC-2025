"use client";

import type { Activities } from "@/types/activities";

import { useState, useEffect, createRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Divider } from "@heroui/react";
import { School, GraduationCap, Users } from "lucide-react";

import { ScopeSelector } from "./activity-modal/ScopeSelector";
import { ImagePreview } from "./activity-modal/ImagePreview";
import { BasicInformation } from "./activity-modal/BasicInformation";
import { ActivityDetails } from "./activity-modal/ActivityDetails";
import { ActivitySettings } from "./activity-modal/ActivitySettings";

import { useUsers } from "@/hooks/useUsers";
import { useMajors } from "@/hooks/useMajor";
import { useActivities } from "@/hooks/useActivities";
import { useSchools } from "@/hooks/useSchool";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  activity?: Activities;
  mode: "add" | "edit";
}

const getSchoolSearchFields = (school: any) => [
  school.name?.en,
  school.name?.th,
  school.acronym,
  school._id
];

const getMajorSearchFields = (major: any) => [
  major.name?.en,
  major.name?.th,
  major.acronym,
  major._id
];

const getUserSearchFields = (user: any) => [
  user.name?.first,
  user.name?.last,
  user.username,
  user._id
];

export function ActivityModal({
  isOpen: isModalOpen,
  onClose,
  onSuccess,
  activity,
  mode
}: ActivityModalProps) {
  const { activityTypes, loading: typesLoading } = useActivities();
  const { schools, loading: schoolsLoading } = useSchools();
  const { majors, loading: majorsLoading } = useMajors();
  const { users, loading: usersLoading } = useUsers();

  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [acronym, setAcronym] = useState("");
  const [fullDetailsEn, setFullDetailsEn] = useState("");
  const [fullDetailsTh, setFullDetailsTh] = useState("");
  const [shortDetailsEn, setShortDetailsEn] = useState("");
  const [shortDetailsTh, setShortDetailsTh] = useState("");
  const [locationEn, setLocationEn] = useState("");
  const [locationTh, setLocationTh] = useState("");
  const [bannerPhoto, setBannerPhoto] = useState<File | null>(null);
  const [logoPhoto, setLogoPhoto] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [type, setType] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isProgressCount, setIsProgressCount] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [scopeMajor, setScopeMajor] = useState<string[]>([]);
  const [scopeSchool, setScopeSchool] = useState<string[]>([]);
  const [scopeUser, setScopeUser] = useState<string[]>([]);

  const bannerInputRef = createRef<HTMLInputElement | null>();
  const logoInputRef = createRef<HTMLInputElement | null>();

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
      setBannerPreview(activity.photo?.bannerPhoto ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}` : "");
      setLogoPreview(activity.photo?.logoPhoto ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.logoPhoto}` : "");
      setType(activity.type || "");
      setIsOpen(activity.metadata?.isOpen ?? true);
      setIsProgressCount(activity.metadata?.isProgressCount ?? true);
      setIsVisible(activity.metadata?.isVisible ?? true);
      setScopeMajor(activity.metadata?.scope?.major || []);
      setScopeSchool(activity.metadata?.scope?.school || []);
      setScopeUser(activity.metadata?.scope?.user || []);
    } else {
      setNameEn("");
      setNameTh("");
      setAcronym("");
      setFullDetailsEn("");
      setFullDetailsTh("");
      setShortDetailsEn("");
      setShortDetailsTh("");
      setLocationEn("");
      setLocationTh("");
      setBannerPhoto(null);
      setLogoPhoto(null);
      setBannerPreview("");
      setLogoPreview("");
      if (!type) {
      setType("");
      }
      setIsOpen(true);
      setIsProgressCount(true);
      setIsVisible(true);
      setScopeMajor([]);
      setScopeSchool([]);
      setScopeUser([]);
    }
  }, [activity, type]);

  const handleFileChange = (file: File | null, type: 'banner' | 'logo') => {
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      if (type === 'banner') {
        setBannerPhoto(file);
        setBannerPreview(reader.result as string);
      } else {
        setLogoPhoto(file);
        setLogoPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!nameEn.trim() || !nameTh.trim() || !type) return;

    const formData = new FormData();
    
    // Basic information
    formData.append("name[en]", nameEn.trim());
    formData.append("name[th]", nameTh.trim());
    formData.append("acronym", acronym.trim() || nameEn.substring(0, 3).toUpperCase());
    formData.append("type", type);

    // Details
    formData.append("fullDetails[en]", fullDetailsEn.trim());
    formData.append("fullDetails[th]", fullDetailsTh.trim());
    formData.append("shortDetails[en]", shortDetailsEn.trim());
    formData.append("shortDetails[th]", shortDetailsTh.trim());

    // Location
    formData.append("location[en]", locationEn.trim());
    formData.append("location[th]", locationTh.trim());

    // Photos
    if (bannerPhoto) {
      formData.append("photo[bannerPhoto]", bannerPhoto);
    }
    if (logoPhoto) {
      formData.append("photo[logoPhoto]", logoPhoto);
    }

    // Metadata
    formData.append("metadata[isOpen]", String(isOpen));
    formData.append("metadata[isProgressCount]", String(isProgressCount));
    formData.append("metadata[isVisible]", String(isVisible));

    // Scope - simplified to match backend expectations
    scopeSchool.forEach((school) => {
      formData.append("metadata[scope][school]", school);
    });
    scopeMajor.forEach((major) => {
      formData.append("metadata[scope][major]", major);
    });
    scopeUser.forEach((user) => {
      formData.append("metadata[scope][user]", user);
    });

    onSuccess(formData, mode);
    onClose();
  };

  return (
    <Modal isOpen={isModalOpen} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add New Activity" : "Edit Activity"}
        </ModalHeader>

        <Divider />

        <ModalBody>
          <div className="flex flex-col gap-6">
            <BasicInformation
              acronym={acronym}
              activityTypes={activityTypes}
              disableTypeSelection={mode === 'add' && !!type}
              nameEn={nameEn}
              nameTh={nameTh}
              setAcronym={setAcronym}
              setNameEn={setNameEn}
              setNameTh={setNameTh}
              setType={setType}
              type={type}
              typesLoading={typesLoading}
            />

            <Divider />

            {/* Photos Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Photos</h3>
              <div className="grid grid-cols-1 gap-6">
                <ImagePreview
                  aspectRatio="aspect-[21/9]"
                  file={bannerPhoto}
                  inputRef={bannerInputRef as React.RefObject<HTMLInputElement>}
                  label="Banner Photo"
                  maxSize="max-h-[300px]"
                  preview={bannerPreview}
                  onFileChange={(file) => handleFileChange(file, 'banner')}
                  onRemove={() => {
                    setBannerPhoto(null);
                    setBannerPreview("");
                  }}
                  />
                <ImagePreview
                  aspectRatio="aspect-square"
                  containerClassName="max-w-[400px]"
                  file={logoPhoto}
                  inputRef={logoInputRef as React.RefObject<HTMLInputElement>}
                  label="Logo Photo"
                  maxSize="max-h-[200px]"
                  preview={logoPreview}
                  onFileChange={(file) => handleFileChange(file, 'logo')}
                  onRemove={() => {
                    setLogoPhoto(null);
                    setLogoPreview("");
                  }}
                />
              </div>
            </div>

            <Divider />

            <ActivityDetails
              fullDetailsEn={fullDetailsEn}
              fullDetailsTh={fullDetailsTh}
              locationEn={locationEn}
              locationTh={locationTh}
              setFullDetailsEn={setFullDetailsEn}
              setFullDetailsTh={setFullDetailsTh}
              setLocationEn={setLocationEn}
              setLocationTh={setLocationTh}
              setShortDetailsEn={setShortDetailsEn}
              setShortDetailsTh={setShortDetailsTh}
              shortDetailsEn={shortDetailsEn}
              shortDetailsTh={shortDetailsTh}
                  />

            <Divider />

            {/* Scope Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Activity Scope</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <ScopeSelector
                  getId={(school) => school._id}
                  getName={(school) => school.name.en}
                  icon={School}
                  isLoading={schoolsLoading}
                  items={schools}
                  label="Schools"
                  placeholder="Select schools..."
                  searchFields={getSchoolSearchFields}
                  selectedItems={scopeSchool}
                  onRemove={(id) => setScopeSchool(prev => prev.filter(s => s !== id))}
                  onSelect={(id) => setScopeSchool(prev => [...prev, id])}
                />
                <ScopeSelector
                  getId={(major) => major._id || ""}
                  getName={(major) => major.name.en}
                  icon={GraduationCap}
                  isLoading={majorsLoading}
                  items={majors}
                  label="Majors"
                  placeholder="Select majors..."
                  searchFields={getMajorSearchFields}
                  selectedItems={scopeMajor}
                  onRemove={(id) => setScopeMajor(prev => prev.filter(m => m !== id))}
                  onSelect={(id) => setScopeMajor(prev => [...prev, id])}
                />
                <ScopeSelector
                  getId={(user) => user._id || ""}
                  getName={(user) => `${user.name.first} ${user.name.last}`}
                  icon={Users}
                  isLoading={usersLoading}
                  items={users}
                  label="Users"
                  placeholder="Select users..."
                  searchFields={getUserSearchFields}
                  selectedItems={scopeUser}
                  onRemove={(id) => setScopeUser(prev => prev.filter(u => u !== id))}
                  onSelect={(id) => setScopeUser(prev => [...prev, id])}
                />
              </div>
            </div>

            <Divider />

            <ActivitySettings
              isOpen={isOpen}
              isProgressCount={isProgressCount}
              isVisible={isVisible}
              setIsOpen={setIsOpen}
              setIsProgressCount={setIsProgressCount}
              setIsVisible={setIsVisible}
            />
          </div>
        </ModalBody>

        <Divider />
        
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === "add" ? "Add Activity" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 