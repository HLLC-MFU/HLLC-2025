import { useState, useRef, useEffect, ChangeEvent, useMemo, RefObject } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useLamduanSetting } from "@/hooks/useLamduanSetting";
import { LamduanSetting } from "@/types/lamduan-flowers";

type LamduanFlowersSettingProps = {
  handleSave: (
    isChanged: boolean,
    file: File | null,
    videoLink: string,
    startDate: string,
    endDate: string
  ) => Promise<void>;
  originalRef: RefObject<LamduanSetting | null>;
}

export function LamduanFlowersSetting({
  handleSave,
  originalRef,
}: LamduanFlowersSettingProps) {
  const { lamduanSetting, fetchLamduanSetting } = useLamduanSetting();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [videoLink, setVideoLink] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

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
    setStartDate(data.startAt?.split("T")[0] || "");
    setEndDate(data.endAt?.split("T")[0] || "");
    originalRef.current = data;
  };

  useEffect(() => {
    fetchLamduanSetting();
  }, []);

  useEffect(() => {
    const latestData = lamduanSetting.at(-1) ?? null;
    populateForm(latestData);
  }, [lamduanSetting]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleClearImage = () => {
    setFile(null);
    setPreview("");
  };

  const handleDiscard = () => {
    const latestData = lamduanSetting.at(-1) ?? null;
    populateForm(latestData);
  };

  const isChanged = useMemo(() => {
    const original = originalRef.current;
    if (!original) return false;

    const originalStart = original.startAt?.split("T")[0] || "";
    const originalEnd = original.endAt?.split("T")[0] || "";

    return (
      videoLink !== original.tutorialVideo ||
      startDate !== originalStart ||
      endDate !== originalEnd ||
      file instanceof File
    );
  }, [videoLink, startDate, endDate, file]);


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-default-700">Lamduan Flower Setting</h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Upload size={14} />}
            onPress={() => inputRef.current?.click()}
          >
            Upload
          </Button>
          {preview && (
            <Button size="sm" variant="flat" color="danger" isIconOnly onPress={handleClearImage}>
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Image Preview */}
      <div className="relative aspect-video rounded-xl overflow-hidden border border-default-200 bg-default-50">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-contain bg-white" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
            <ImageIcon size={24} />
            <span className="text-xs">No image uploaded</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Video Input */}
      <div className="flex w-full flex-wrap md:flex-nowrap mb-2 gap-4 py-2">
        <Input
          label="Link Youtube"
          labelPlacement="outside"
          placeholder="https://youtube.com/watch?v=..."
          type="url"
          value={videoLink}
          onChange={(e) => setVideoLink(e.target.value)}
        />
      </div>

      {/* Event Date Range */}
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          label="Event start"
          labelPlacement="outside"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Event end"
          labelPlacement="outside"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="light" color="danger" size="md" onPress={handleDiscard}>
          Discard Changes
        </Button>
        <Button variant="solid" color="primary" size="md" onPress={() => handleSave(isChanged, file, videoLink, startDate, endDate)}>
          Save
        </Button>
      </div>
    </div>
  );
}
