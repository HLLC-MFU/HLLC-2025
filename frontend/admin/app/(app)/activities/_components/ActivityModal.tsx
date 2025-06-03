"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Switch, Select, SelectItem } from "@heroui/react";
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
  const { activityTypes } = useActivities();
  const [fullNameEn, setFullNameEn] = useState("");
  const [fullNameTh, setFullNameTh] = useState("");
  const [shortNameEn, setShortNameEn] = useState("");
  const [shortNameTh, setShortNameTh] = useState("");
  const [fullDetailsEn, setFullDetailsEn] = useState("");
  const [fullDetailsTh, setFullDetailsTh] = useState("");
  const [shortDetailsEn, setShortDetailsEn] = useState("");
  const [shortDetailsTh, setShortDetailsTh] = useState("");
  const [location, setLocation] = useState("");
  const [bannerPhoto, setBannerPhoto] = useState("");
  const [logoPhoto, setLogoPhoto] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isProgressCount, setIsProgressCount] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (activity) {
      setFullNameEn(activity.fullName?.en || "");
      setFullNameTh(activity.fullName?.th || "");
      setShortNameEn(activity.shortName?.en || "");
      setShortNameTh(activity.shortName?.th || "");
      setFullDetailsEn(activity.fullDetails?.en || "");
      setFullDetailsTh(activity.fullDetails?.th || "");
      setShortDetailsEn(activity.shortDetails?.en || "");
      setShortDetailsTh(activity.shortDetails?.th || "");
      setLocation(activity.location || "");
      setBannerPhoto(activity.photo?.bannerPhoto || "");
      setLogoPhoto(activity.photo?.logoPhoto || "");
      setType(activity.type || "");
      setTags(activity.tags || []);
      setIsRegistrationOpen(activity.metadata?.isOpen ?? true);
      setIsProgressCount(activity.metadata?.isProgrssCount ?? true);
      setIsVisible(activity.metadata?.isVisible ?? true);
    } else {
      setFullNameEn("");
      setFullNameTh("");
      setShortNameEn("");
      setShortNameTh("");
      setFullDetailsEn("");
      setFullDetailsTh("");
      setShortDetailsEn("");
      setShortDetailsTh("");
      setLocation("");
      setBannerPhoto("");
      setLogoPhoto("");
      setType("");
      setTags([]);
      setIsRegistrationOpen(true);
      setIsProgressCount(true);
      setIsVisible(true);
    }
  }, [activity]);

  const handleSubmit = () => {
    if (!fullNameEn.trim() || !fullNameTh.trim() || !type) return;

    const updatedActivity: Partial<Activities> = {
      ...activity,
      fullName: { en: fullNameEn.trim(), th: fullNameTh.trim() },
      shortName: { en: shortNameEn.trim(), th: shortNameTh.trim() },
      fullDetails: { en: fullDetailsEn.trim(), th: fullDetailsTh.trim() },
      shortDetails: { en: shortDetailsEn.trim(), th: shortDetailsTh.trim() },
      location: location.trim(),
      type: type,
      tags: tags,
      photo: {
        bannerPhoto: bannerPhoto.trim(),
        logoPhoto: logoPhoto.trim()
      },
      metadata: {
        isOpen: isRegistrationOpen,
        isProgrssCount: isProgressCount,
        isVisible,
        scope: activity?.metadata?.scope || { major: [], school: [], user: [] }
      }
    };

    onSuccess(updatedActivity, mode);
    onClose();
  };

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === "add" ? "Add New Activity" : "Edit Activity"}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name (English)"
                placeholder="Enter activity full name in English"
                value={fullNameEn}
                onValueChange={setFullNameEn}
              />
              <Input
                label="Full Name (Thai)"
                placeholder="Enter activity full name in Thai"
                value={fullNameTh}
                onValueChange={setFullNameTh}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Short Name (English)"
                placeholder="Enter activity short name in English"
                value={shortNameEn}
                onValueChange={setShortNameEn}
              />
              <Input
                label="Short Name (Thai)"
                placeholder="Enter activity short name in Thai"
                value={shortNameTh}
                onValueChange={setShortNameTh}
              />
            </div>
            <Select
              label="Activity Type"
              placeholder="Select an activity type"
              selectedKeys={type ? [type] : []}
              onChange={(e) => setType(e.target.value)}
            >
              {activityTypes.map((type) => (
                <SelectItem key={type._id}>
                  {type.name}
                </SelectItem>
              ))}
            </Select>
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
            <Input
              label="Location"
              placeholder="Enter activity location"
              value={location}
              onValueChange={setLocation}
            />
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
            <div className="flex flex-col gap-2">
              <Switch
                isSelected={isRegistrationOpen}
                onValueChange={setIsRegistrationOpen}
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
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === "add" ? "Add" : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 