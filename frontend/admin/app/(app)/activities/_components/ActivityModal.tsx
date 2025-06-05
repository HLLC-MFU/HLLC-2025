"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Switch, Select, SelectItem, Divider } from "@heroui/react";
import { useState, useEffect } from "react";
import type { Activities, ActivityType } from "@/types/activities";
import { useActivities } from "@/hooks/useActivities";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (activity: Partial<Activities>, mode: "add" | "edit") => void;
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
  const [bannerPhoto, setBannerPhoto] = useState("");
  const [logoPhoto, setLogoPhoto] = useState("");
  const [type, setType] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isProgressCount, setIsProgressCount] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [scopeMajor, setScopeMajor] = useState<string[]>([]);
  const [scopeSchool, setScopeSchool] = useState<string[]>([]);
  const [scopeUser, setScopeUser] = useState<string[]>([]);

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
      setBannerPhoto(activity.photo?.bannerPhoto || "");
      setLogoPhoto(activity.photo?.logoPhoto || "");
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
      setBannerPhoto("");
      setLogoPhoto("");
      setType("");
      setIsOpen(true);
      setIsProgressCount(true);
      setIsVisible(true);
      setScopeMajor([]);
      setScopeSchool([]);
      setScopeUser([]);
    }
  }, [activity]);

  const handleSubmit = () => {
    if (!nameEn.trim() || !nameTh.trim() || !type) return;

    const updatedActivity: Partial<Activities> = {
      ...activity,
      name: { en: nameEn.trim(), th: nameTh.trim() },
      acronym: acronym.trim() || nameEn.substring(0, 3).toUpperCase(),
      fullDetails: { en: fullDetailsEn.trim(), th: fullDetailsTh.trim() },
      shortDetails: { en: shortDetailsEn.trim(), th: shortDetailsTh.trim() },
      location: { en: locationEn.trim(), th: locationTh.trim() },
      type: type,
      photo: {
        bannerPhoto: bannerPhoto.trim(),
        logoPhoto: logoPhoto.trim() || undefined
      },
      metadata: {
        isOpen,
        isProgressCount,
        isVisible,
        scope: {
          major: scopeMajor,
          school: scopeSchool,
          user: scopeUser
        }
      }
    };

    onSuccess(updatedActivity, mode);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Banner Photo URL"
                  placeholder="Enter banner photo URL"
                  value={bannerPhoto}
                  onValueChange={setBannerPhoto}
                />
                <Input
                  label="Logo Photo URL"
                  placeholder="Enter logo photo URL"
                  value={logoPhoto}
                  onValueChange={setLogoPhoto}
                />
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