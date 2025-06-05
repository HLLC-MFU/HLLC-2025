"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Divider } from "@heroui/react";
import { useState, useEffect, createRef } from "react";
import type { Activities } from "@/types/activities";
import { useActivities } from "@/hooks/useActivities";
import { useSchools } from "@/hooks/useSchool";
import { useMajors } from "@/hooks/useMajor";
import { useUsers } from "@/hooks/useUsers";
import { School, GraduationCap, Users } from "lucide-react";

import { ScopeSelector } from "./activity-modal/ScopeSelector";
import { ImagePreview } from "./activity-modal/ImagePreview";
import { BasicInformation } from "./activity-modal/BasicInformation";
import { ActivityDetails } from "./activity-modal/ActivityDetails";
import { ActivitySettings } from "./activity-modal/ActivitySettings";

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
      setBannerPreview(activity.photo?.bannerPhoto ? `http://localhost:8080/uploads/${activity.photo.bannerPhoto}` : "");
      setLogoPreview(activity.photo?.logoPhoto ? `http://localhost:8080/uploads/${activity.photo.logoPhoto}` : "");
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
    <Modal isOpen={isModalOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add New Activity" : "Edit Activity"}
        </ModalHeader>
        <Divider />
        <ModalBody>
          <div className="flex flex-col gap-6">
            <BasicInformation
              nameEn={nameEn}
              setNameEn={setNameEn}
              nameTh={nameTh}
              setNameTh={setNameTh}
              acronym={acronym}
              setAcronym={setAcronym}
              type={type}
              setType={setType}
              activityTypes={activityTypes}
              typesLoading={typesLoading}
              disableTypeSelection={mode === 'add' && !!type}
            />

            <Divider />

            {/* Photos Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Photos</h3>
              <div className="grid grid-cols-1 gap-6">
                <ImagePreview
                  label="Banner Photo"
                  preview={bannerPreview}
                  file={bannerPhoto}
                  onFileChange={(file) => handleFileChange(file, 'banner')}
                  onRemove={() => {
                    setBannerPhoto(null);
                    setBannerPreview("");
                  }}
                  inputRef={bannerInputRef as React.RefObject<HTMLInputElement>}
                  aspectRatio="aspect-[21/9]"
                  maxSize="max-h-[300px]"
                  />
                <ImagePreview
                  label="Logo Photo"
                  preview={logoPreview}
                  file={logoPhoto}
                  onFileChange={(file) => handleFileChange(file, 'logo')}
                  onRemove={() => {
                    setLogoPhoto(null);
                    setLogoPreview("");
                  }}
                  inputRef={logoInputRef as React.RefObject<HTMLInputElement>}
                  aspectRatio="aspect-square"
                  maxSize="max-h-[200px]"
                  containerClassName="max-w-[400px]"
                />
              </div>
            </div>

            <Divider />

            <ActivityDetails
              fullDetailsEn={fullDetailsEn}
              setFullDetailsEn={setFullDetailsEn}
              fullDetailsTh={fullDetailsTh}
              setFullDetailsTh={setFullDetailsTh}
              shortDetailsEn={shortDetailsEn}
              setShortDetailsEn={setShortDetailsEn}
              shortDetailsTh={shortDetailsTh}
              setShortDetailsTh={setShortDetailsTh}
              locationEn={locationEn}
              setLocationEn={setLocationEn}
              locationTh={locationTh}
              setLocationTh={setLocationTh}
                  />

            <Divider />

            {/* Scope Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Activity Scope</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <ScopeSelector
                  label="Schools"
                  icon={School}
                  items={schools}
                  selectedItems={scopeSchool}
                  onSelect={(id) => setScopeSchool(prev => [...prev, id])}
                  onRemove={(id) => setScopeSchool(prev => prev.filter(s => s !== id))}
                  isLoading={schoolsLoading}
                  placeholder="Select schools..."
                  getName={(school) => school.name.en}
                  getId={(school) => school._id}
                  searchFields={getSchoolSearchFields}
                />
                <ScopeSelector
                  label="Majors"
                  icon={GraduationCap}
                  items={majors}
                  selectedItems={scopeMajor}
                  onSelect={(id) => setScopeMajor(prev => [...prev, id])}
                  onRemove={(id) => setScopeMajor(prev => prev.filter(m => m !== id))}
                  isLoading={majorsLoading}
                  placeholder="Select majors..."
                  getName={(major) => major.name.en}
                  getId={(major) => major._id || ""}
                  searchFields={getMajorSearchFields}
                />
                <ScopeSelector
                  label="Users"
                  icon={Users}
                  items={users}
                  selectedItems={scopeUser}
                  onSelect={(id) => setScopeUser(prev => [...prev, id])}
                  onRemove={(id) => setScopeUser(prev => prev.filter(u => u !== id))}
                  isLoading={usersLoading}
                  placeholder="Select users..."
                  getName={(user) => `${user.name.first} ${user.name.last}`}
                  getId={(user) => user._id || ""}
                  searchFields={getUserSearchFields}
                />
              </div>
            </div>

            <Divider />

            <ActivitySettings
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isProgressCount={isProgressCount}
              setIsProgressCount={setIsProgressCount}
              isVisible={isVisible}
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