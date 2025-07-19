"use client";

import type { Activities } from "@/types/activities";

import { useState, useEffect, createRef } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider
} from "@heroui/react";
import { School, GraduationCap, Users } from "lucide-react";
import { getLocalTimeZone, now, parseAbsoluteToLocal, ZonedDateTime } from "@internationalized/date";

import { ScopeSelector } from "./activity-modal/ScopeSelector";
import { ImagePreview } from "./activity-modal/ImagePreview";
import { BasicInformation } from "./activity-modal/BasicInformation";
import { ActivityDetails } from "./activity-modal/ActivityDetails";
import { ActivitySettings } from "./activity-modal/ActivitySettings";
import { DateTimeSelector } from "./activity-modal/TimeSelector";
import { LocationInput } from "./activity-modal/LocationInput";

import { useUsers } from "@/hooks/useUsers";
import { useMajors } from "@/hooks/useMajor";
import { useActivities } from "@/hooks/useActivities";
import { useSchools } from "@/hooks/useSchool";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  activity?: { type: string };
  mode: "add" | "edit";
  typeActivities: string | undefined;
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
  mode,
  typeActivities,
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
  const [isOpen, setIsOpen] = useState(true);
  const [isProgressCount, setIsProgressCount] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [scopeMajor, setScopeMajor] = useState<string[]>([]);
  const [scopeSchool, setScopeSchool] = useState<string[]>([]);
  const [scopeUser, setScopeUser] = useState<string[]>([]);

  const [checkinTime, setCheckinTime] = useState(() => now(getLocalTimeZone()));
  const [startTime, setStartTime] = useState(() => now(getLocalTimeZone()));
  const [endTime, setEndTime] = useState(() => now(getLocalTimeZone()));
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [thLocation, setThLocation] = useState("");
  const [enLocation, setEnLocation] = useState("");

  const bannerInputRef = createRef<HTMLInputElement | null>();
  const logoInputRef = createRef<HTMLInputElement | null>();

  function isValidISODateString(date: string | null | undefined): date is string {
    return typeof date === "string" && date.trim() !== "" && !isNaN(Date.parse(date));
  }

  const populateActivityForm = (activity: Activities) => {
    setNameEn(activity.name?.en || "");
    setNameTh(activity.name?.th || "");
    setAcronym(activity.acronym || "");
    setFullDetailsEn(activity.fullDetails?.en || "");
    setFullDetailsTh(activity.fullDetails?.th || "");
    setShortDetailsEn(activity.shortDetails?.en || "");
    setShortDetailsTh(activity.shortDetails?.th || "");
    setLocationEn(activity.location?.en || "");
    setLocationTh(activity.location?.th || "");
    setBannerPreview(
      activity.photo?.bannerPhoto
        ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.bannerPhoto}`
        : ""
    );
    setLogoPreview(
      activity.photo?.logoPhoto
        ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo.logoPhoto}`
        : ""
    );
    setIsOpen(activity.metadata?.isOpen ?? true);
    setIsProgressCount(activity.metadata?.isProgressCount ?? true);
    setIsVisible(activity.metadata?.isVisible ?? true);
    setScopeMajor(
      Array.isArray(activity.metadata?.scope?.major)
        ? activity.metadata.scope.major.map((m: any) => m._id)
        : []
    );
    setScopeSchool(
      Array.isArray(activity.metadata?.scope?.school)
        ? activity.metadata.scope.school.map((s: any) => s._id)
        : []
    );
    setScopeUser(
      Array.isArray(activity.metadata?.scope?.user)
        ? activity.metadata.scope.user.map((u: any) => u._id)
        : []
    );

    // Parse ISO strings to ZonedDateTime for date/time pickers
    setCheckinTime(
      isValidISODateString(activity?.metadata?.checkinStartAt)
        ? parseAbsoluteToLocal(activity.metadata.checkinStartAt)
        : now(getLocalTimeZone())
    );

    setStartTime(
      isValidISODateString(activity?.metadata?.startAt)
        ? parseAbsoluteToLocal(activity.metadata.startAt)
        : now(getLocalTimeZone())
    );

    setEndTime(
      isValidISODateString(activity?.metadata?.endAt)
        ? parseAbsoluteToLocal(activity.metadata.endAt)
        : now(getLocalTimeZone())
    );

    setLatitude(activity.location?.latitude?.toString() || "");
    setLongitude(activity.location?.longitude?.toString() || "");
    setMapUrl(activity.location?.mapUrl || "");
    setThLocation(activity.location?.th || "");
    setEnLocation(activity.location?.en || "");
  };

  const resetActivityForm = () => {
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
    setIsOpen(true);
    setIsProgressCount(true);
    setIsVisible(true);
    setScopeMajor([]);
    setScopeSchool([]);
    setScopeUser([]);
    setCheckinTime(now(getLocalTimeZone()));
    setStartTime(now(getLocalTimeZone()));
    setEndTime(now(getLocalTimeZone()));
  };

  useEffect(() => {
    if (activity) {
      populateActivityForm(activity as Activities);
    } else {
      resetActivityForm();
    }
  }, [activity]);

  const handleFileChange = (file: File | null, type: "banner" | "logo") => {
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      if (type === "banner") {
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
    if (!nameEn.trim() || !nameTh.trim() || !activity?.type) return;

    const formData = new FormData();

    formData.append("name[en]", nameEn.trim());
    formData.append("name[th]", nameTh.trim());
    formData.append("acronym", acronym.trim() || nameEn.substring(0, 3).toUpperCase());
    formData.append("type", activity?.type);

    formData.append("fullDetails[en]", fullDetailsEn.trim());
    formData.append("fullDetails[th]", fullDetailsTh.trim());
    formData.append("shortDetails[en]", shortDetailsEn.trim());
    formData.append("shortDetails[th]", shortDetailsTh.trim());

    formData.append("location[en]", locationEn.trim());
    formData.append("location[th]", locationTh.trim());

    if (bannerPhoto) formData.append("photo[bannerPhoto]", bannerPhoto);
    if (logoPhoto) formData.append("photo[logoPhoto]", logoPhoto);

    formData.append("metadata[isOpen]", String(isOpen));
    formData.append("metadata[isProgressCount]", String(isProgressCount));
    formData.append("metadata[isVisible]", String(isVisible));

    formData.append("metadata[checkinStartAt]", checkinTime.toDate().toISOString());
    formData.append("metadata[startAt]", startTime.toDate().toISOString());
    formData.append("metadata[endAt]", endTime.toDate().toISOString());

    scopeSchool.forEach((id) => formData.append("metadata[scope][school]", id));
    scopeMajor.forEach((id) => formData.append("metadata[scope][major]", id));
    scopeUser.forEach((id) => formData.append("metadata[scope][user]", id));

    formData.append("location[latitude]", latitude);
    formData.append("location[longitude]", longitude);
    formData.append("location[mapUrl]", mapUrl);
    formData.append("location[th]", thLocation);
    formData.append("location[en]", enLocation);

    console.log('Calling onSuccess with formData:', formData);
    onSuccess(formData, mode);
    console.log('onSuccess called');
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
              disableTypeSelection={mode === "add" && !!typeActivities}
              nameEn={nameEn}
              nameTh={nameTh}
              setAcronym={setAcronym}
              setNameEn={setNameEn}
              setNameTh={setNameTh}
              typesLoading={typesLoading}
            />

            <Divider />

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
                  onFileChange={(file) => handleFileChange(file, "banner")}
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
                  onFileChange={(file) => handleFileChange(file, "logo")}
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
                  onRemove={(id) => setScopeSchool((prev) => prev.filter((s) => s !== id))}
                  onSelect={(id) => setScopeSchool((prev) => [...prev, id])}
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
                  onRemove={(id) => setScopeMajor((prev) => prev.filter((m) => m !== id))}
                  onSelect={(id) => setScopeMajor((prev) => [...prev, id])}
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
                  onRemove={(id) => setScopeUser((prev) => prev.filter((u) => u !== id))}
                  onSelect={(id) => setScopeUser((prev) => [...prev, id])}
                />
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-sm font-medium mb-3">Time Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <DateTimeSelector label="Check-in Start Time" value={checkinTime} onChange={(value) => {
                  if (value instanceof ZonedDateTime) {
                    setCheckinTime(value);
                  }
                }} />
                <DateTimeSelector label="Activities Start Time" value={startTime} onChange={(value) => {
                  if (value instanceof ZonedDateTime) {
                    setStartTime(value);
                  }
                }} />
                <DateTimeSelector label="Activities End Time" value={endTime} onChange={(value) => {
                  if (value instanceof ZonedDateTime) {
                    setEndTime(value);
                  }
                }} />
              </div>
            </div>
            <Divider />
            <h3 className="text-sm font-medium mb-3">Activity Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <LocationInput
                label="Latitude"
                value={latitude}
                onChange={(value) => setLatitude(value)}
              />
              <LocationInput
                label="Longitude"
                value={longitude}
                onChange={(value) => setLongitude(value)}
              />
              <LocationInput
                label="Map URL"
                value={mapUrl}
                onChange={(value) => setMapUrl(value)}
              />
              <LocationInput
                label="Location (TH)"
                value={thLocation}
                onChange={(value) => setThLocation(value)}
              />
              <LocationInput
                label="Location (EN)"
                value={enLocation}
                onChange={(value) => setEnLocation(value)}
              />
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
