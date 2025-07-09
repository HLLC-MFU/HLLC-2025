import { useState, useRef, useEffect, ChangeEvent, useMemo, RefObject } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

import { useLamduanSetting } from "@/hooks/useLamduanSetting";
import { LamduanSetting } from "@/types/lamduan-flowers";

type SettingLamduanFlowersProps = {
  handleSave: (
    isChanged: boolean,
    file: File | null,
    videoLink: string,
    startDate: string,
    endDate: string
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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [errors, setErrors] = useState({
    file: "",
    videoLink: "",
    startDate: "",
    endDate: "",
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const toLocalDatetime = (iso: string | undefined | null) => {
    if (!iso) return "";
    const date = new Date(iso);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 16);
  };

  const populateForm = (data: LamduanSetting | null) => {
    if (!data) {
      setFile(null);
      setPreview("");
      setVideoLink("");
      setStartDate("");
      setEndDate("");
      originalRef.current = null;

      return;
    }

    setFile(null);
    setPreview(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${data.tutorialPhoto}`);
    setVideoLink(data.tutorialVideo);
    setStartDate(toLocalDatetime(data.startAt));
    setEndDate(toLocalDatetime(data.endAt));
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
    });
  };

  const isChanged = useMemo(() => {
    const original = originalRef.current;

    if (!original) return true;

    const originalStart = toLocalDatetime(original.startAt);
    const originalEnd = toLocalDatetime(original.endAt);

    return (
      videoLink !== original.tutorialVideo ||
      startDate !== originalStart ||
      endDate !== originalEnd ||
      file instanceof File
    );
  }, [videoLink, startDate, endDate, file]);

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
      startDate: startDate.trim() === "" ? "Start date is required" : "",
      endDate: endDate.trim() === "" ? "End date is required" : "",
    };

    setErrors(newErrors);

    const hasError = Object.values(newErrors).some((v) => v !== "");

    if (hasError) return;

    handleSave(isChanged, file, videoLink, startDate, endDate);
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
      {errors.file && <p className="text-sm text-danger  mt-1">{errors.file}</p>}

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
            clearError('videoLink');
          }}
          isInvalid={!!errors.videoLink}
          errorMessage={errors.videoLink}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <Input
          isRequired
          className="w-full"
          errorMessage={errors.startDate}
          isInvalid={!!errors.startDate}
          label="Event start"
          labelPlacement="inside"
          placeholder=" "
          type="datetime-local"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            clearError('startDate');
          }}
        />
        <Input
          isRequired
          className="w-full"
          errorMessage={errors.endDate}
          isInvalid={!!errors.endDate}
          label="Event end"
          labelPlacement="inside"
          placeholder=" "
          type="datetime-local"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            clearError('endDate');
          }}
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
