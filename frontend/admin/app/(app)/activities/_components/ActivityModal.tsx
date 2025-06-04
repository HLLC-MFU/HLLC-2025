"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Switch, Select, SelectItem, Divider } from "@heroui/react";
import { useState, useEffect, createRef } from "react";
import type { Activities, ActivityType } from "@/types/activities";
import { useActivities } from "@/hooks/useActivities";
import { Image, CheckCircle } from "lucide-react";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData, mode: "add" | "edit") => void;
  activity?: Activities;
  mode: "add" | "edit";
}

export function ActivityModal({
  isOpen: isModalOpen,
  onClose,
  onSuccess,
  activity,
  mode
}: ActivityModalProps) {
  const { activityTypes, loading: typesLoading } = useActivities();
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

  const bannerInputRef = createRef<HTMLInputElement>();
  const logoInputRef = createRef<HTMLInputElement>();

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
      setBannerPreview(activity.photo?.bannerPhoto || "");
      setLogoPreview(activity.photo?.logoPhoto || "");
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
      setType("");
      setIsOpen(true);
      setIsProgressCount(true);
      setIsVisible(true);
      setScopeMajor([]);
      setScopeSchool([]);
      setScopeUser([]);
    }
  }, [activity]);

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

    // Scope
    scopeMajor.forEach((major, index) => {
      formData.append(`metadata[scope][major][${index}]`, major);
    });
    scopeSchool.forEach((school, index) => {
      formData.append(`metadata[scope][school][${index}]`, school);
    });
    scopeUser.forEach((user, index) => {
      formData.append(`metadata[scope][user][${index}]`, user);
    });

    onSuccess(formData, mode);
    onClose();
  };

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add New Activity" : "Edit Activity"}
        </ModalHeader>
        <Divider />
        <ModalBody>
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Basic Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Name (English)"
                    placeholder="Enter activity name in English"
                    value={nameEn}
                    onValueChange={setNameEn}
                    isRequired
                  />
                  <Input
                    label="Name (Thai)"
                    placeholder="Enter activity name in Thai"
                    value={nameTh}
                    onValueChange={setNameTh}
                    isRequired
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Acronym"
                    placeholder="Enter activity acronym or leave empty for auto-generation"
                    value={acronym}
                    onValueChange={setAcronym}
                  />
                  <Select
                    label="Activity Type"
                    placeholder="Select an activity type"
                    selectedKeys={type ? [type] : []}
                    onChange={(e) => setType(e.target.value)}
                    isLoading={typesLoading}
                    isRequired
                  >
                    {activityTypes.map((type) => (
                      <SelectItem key={type._id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-sm font-medium mb-3">Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Textarea
                    label="Full Details (English)"
                    placeholder="Enter full details in English"
                    value={fullDetailsEn}
                    onValueChange={setFullDetailsEn}
                    minRows={4}
                  />
                  <Textarea
                    label="Full Details (Thai)"
                    placeholder="Enter full details in Thai"
                    value={fullDetailsTh}
                    onValueChange={setFullDetailsTh}
                    minRows={4}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Textarea
                    label="Short Details (English)"
                    placeholder="Enter short details in English"
                    value={shortDetailsEn}
                    onValueChange={setShortDetailsEn}
                    minRows={2}
                  />
                  <Textarea
                    label="Short Details (Thai)"
                    placeholder="Enter short details in Thai"
                    value={shortDetailsTh}
                    onValueChange={setShortDetailsTh}
                    minRows={2}
                  />
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-sm font-medium mb-3">Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Location (English)"
                  placeholder="Enter location in English"
                  value={locationEn}
                  onValueChange={setLocationEn}
                />
                <Input
                  label="Location (Thai)"
                  placeholder="Enter location in Thai"
                  value={locationTh}
                  onValueChange={setLocationTh}
                />
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-sm font-medium mb-3">Photos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold capitalize text-lg">Banner Photo</h4>
                  <div className="relative max-w-xs mx-auto">
                    <label htmlFor="upload-banner" className="cursor-pointer block">
                      <img
                        src={bannerPreview || "http://localhost:8080/uploads/default-banner.jpg"}
                        alt="Banner"
                        className="w-full rounded-xl shadow-lg"
                      />
                    </label>
                    <input
                      id="upload-banner"
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(file, 'banner');
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

                <div className="space-y-4">
                  <h4 className="font-semibold capitalize text-lg">Logo Photo</h4>
                  <div className="relative max-w-xs mx-auto">
                    <label htmlFor="upload-logo" className="cursor-pointer block">
                      <img
                        src={logoPreview || "http://localhost:8080/uploads/default-logo.jpg"}
                        alt="Logo"
                        className="w-full rounded-xl shadow-lg"
                      />
                    </label>
                    <input
                      id="upload-logo"
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(file, 'logo');
                      }}
                      className="hidden"
                    />
                  </div>
                  {logoPhoto && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                      <CheckCircle className="w-3 h-3" />
                      <span>📁 {logoPhoto.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-sm font-medium mb-3">Settings</h3>
              <div className="flex flex-col gap-2">
                <Switch
                  isSelected={isOpen}
                  onValueChange={setIsOpen}
                  size="sm"
                >
                  Open for Registration
                </Switch>
                <Switch
                  isSelected={isProgressCount}
                  onValueChange={setIsProgressCount}
                  size="sm"
                >
                  Count Progress
                </Switch>
                <Switch
                  isSelected={isVisible}
                  onValueChange={setIsVisible}
                  size="sm"
                >
                  Visible to Users
                </Switch>
              </div>
            </div>
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