import { useState, useRef, useEffect, ChangeEvent, useMemo, RefObject } from "react";
import { Button } from "@heroui/button";
import { DatePicker, Input, Textarea } from "@heroui/react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

import { useLamduanSetting } from "@/hooks/useLamduanSetting";
import { LamduanSetting } from "@/types/lamduan-flowers";
import { fromDate } from "@internationalized/date";

type SettingLamduanFlowersProps = {
  handleSave: (
    isChanged: boolean,
    file: File | null,
    videoLink: string,
    startDate: string,
    endDate: string,
    description: { th: string; en: string }
  ) => Promise<void>;
  originalRef: RefObject<LamduanSetting | null>;
};

export function SettingLamduanFlowers({
  handleSave,
  originalRef,
}: SettingLamduanFlowersProps) {
  const { lamduanSetting, fetchLamduanSetting } = useLamduanSetting();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [videoLink, setVideoLink] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [descriptionTh, setDescriptionTh] = useState<string>("");
  const [descriptionEn, setDescriptionEn] = useState<string>("");

  const parseISOToDate = (isoStr?: string | null) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    // ถ้าต้องปรับเวลา timezone เพิ่ม 7 ชม. เช่นในเดิม ก็ใส่
    d.setHours(d.getHours() + 7);
    return d;
  };

  const [errors, setErrors] = useState({
    file: "",
    videoLink: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const populateForm = (data: LamduanSetting | null) => {
    if (!data) {
      setFile(null);
      setPreview("");
      setVideoLink("");
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      setStartDate(now);
      setEndDate(tomorrow);
      setDescriptionTh("");
      setDescriptionEn("");
      originalRef.current = null;
      return;
    }

    setFile(null);
    setPreview(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${data.tutorialPhoto}`);
    setVideoLink(data.tutorialVideo);
    setStartDate(parseISOToDate(data.startAt));
    setEndDate(parseISOToDate(data.endAt));
    setDescriptionTh(data.description?.th ?? "");
    setDescriptionEn(data.description?.en ?? "");
    originalRef.current = data;
  };

  useEffect(() => {
    fetchLamduanSetting();
  }, []);

  useEffect(() => {
    const latestData = lamduanSetting.at(-1) ?? null;
    populateForm(latestData);
  }, [lamduanSetting]);

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      clearError('file');
    }
  };

  const handleClearImage = () => {
    setFile(null);
    setPreview("");
  };

  const handleDiscard = () => {
    const latestData = lamduanSetting.at(-1) ?? null;
    populateForm(latestData);
    setErrors({
      file: "",
      videoLink: "",
      startDate: "",
      endDate: "",
      description: "",
    });
  };

  const isChanged = useMemo(() => {
    const original = originalRef.current;
    if (!original) return true;

    const originalStart = parseISOToDate(original.startAt);
    const originalEnd = parseISOToDate(original.endAt);

    return (
      videoLink !== original.tutorialVideo ||
      startDate !== originalStart ||
      endDate !== originalEnd ||
      descriptionTh !== (original.description?.th ?? "") ||
      descriptionEn !== (original.description?.en ?? "") ||
      file instanceof File
    );
  }, [videoLink, startDate, endDate, descriptionTh, descriptionEn, file]);

  const isYoutubeLink = (urlString: string) => {
    try {
      const url = new URL(urlString.trim());
      const hostname = url.hostname.toLowerCase();
      if (hostname === "www.youtube.com" || hostname === "youtube.com") {
        return url.searchParams.has("v") && url.searchParams.get("v")!.length === 11;
      }
      if (hostname === "youtu.be") {
        const videoId = url.pathname.slice(1);
        return videoId.length === 11;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleValidateAndSave = () => {
    const newErrors = {
      file: !file && !preview ? "Image is required" : "",
      videoLink:
        videoLink.trim() === ""
          ? "Video link is required"
          : !isYoutubeLink(videoLink)
            ? "Video link must be a valid YouTube URL"
            : "",
      startDate: startDate === null ? "Start date is required" : "",
      endDate: endDate === null ? "End date is required" : "",
      description:
        !descriptionTh.trim() && !descriptionEn.trim()
          ? "At least one language must be filled"
          : "",
    };

    setErrors(newErrors);

    const hasError = Object.values(newErrors).some((v) => v !== "");
    if (hasError) return;

    handleSave(isChanged, file, videoLink, startDate ? startDate.toISOString() : "", endDate ? endDate.toISOString() : "", {
      th: descriptionTh,
      en: descriptionEn,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-default-700">Lamduan Flower Setting</h4>
        <div className="flex gap-2">
          <Button
            color="primary"
            size="sm"
            startContent={<Upload size={14} />}
            variant="flat"
            onPress={() => inputRef.current?.click()}
          >
            Upload
          </Button>
          {preview && (
            <Button isIconOnly color="danger" size="sm" variant="flat" onPress={handleClearImage}>
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden border border-default-200 bg-default-50">
        {preview ? (
          <img alt="Preview" className="w-full h-full object-contain bg-white" src={preview} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
            <ImageIcon size={24} />
            <span className="text-xs">No image uploaded</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {errors.file && <p className="text-sm text-danger mt-1">{errors.file}</p>}

      <div className="flex flex-col md:flex-row gap-4">
        <Textarea
          isRequired
          label="Description (EN)"
          labelPlacement="outside"
          placeholder="Describe activity in English"
          value={descriptionEn}
          onChange={(e) => {
            setDescriptionEn(e.target.value);
            clearError("description");
          }}
          isInvalid={!!errors.description}
          className="w-full h-50 resize-none"
        />
        <Textarea
          isRequired
          label="คำอธิบาย (TH)"
          labelPlacement="outside"
          placeholder="อธิบายกิจกรรมเป็นภาษาไทย"
          value={descriptionTh}
          onChange={(e) => {
            setDescriptionTh(e.target.value);
            clearError("description");
          }}
          isInvalid={!!errors.description}
          className="w-full h-50 resize-none"
        />
      </div>

      {errors.description && (
        <p className="text-sm text-danger mt-1">{errors.description}</p>
      )}


      <div className="flex w-full flex-wrap md:flex-nowrap mb-2 gap-4 py-2">
        <Input
          isRequired
          errorMessage={errors.videoLink}
          isInvalid={!!errors.videoLink}
          label="Link Youtube"
          labelPlacement="outside"
          placeholder="https://youtube.com/watch?v=..."
          type="url"
          value={videoLink}
          onChange={(e) => {
            setVideoLink(e.target.value);
            clearError("videoLink");
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <DatePicker
          isRequired
          label="Start Date & Time"
          value={startDate ? fromDate(startDate, "Asia/Bangkok") : undefined}
          onChange={(date) => setStartDate(date?.toDate() ?? startDate)}
        />
        <DatePicker
          isRequired
          label="End Date & Time"
          value={endDate ? fromDate(endDate, "Asia/Bangkok") : undefined}
          onChange={(date) => setEndDate(date?.toDate() ?? endDate)}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button color="danger" size="md" variant="light" onPress={handleDiscard}>
          Discard Changes
        </Button>
        <Button color="primary" size="md" variant="solid" onPress={handleValidateAndSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
