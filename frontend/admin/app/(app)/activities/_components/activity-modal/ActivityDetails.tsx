import { Input, Textarea } from "@heroui/react";

interface ActivityDetailsProps {
  fullDetailsEn: string;
  setFullDetailsEn: (value: string) => void;
  fullDetailsTh: string;
  setFullDetailsTh: (value: string) => void;
  shortDetailsEn: string;
  setShortDetailsEn: (value: string) => void;
  shortDetailsTh: string;
  setShortDetailsTh: (value: string) => void;
  locationEn: string;
  setLocationEn: (value: string) => void;
  locationTh: string;
  setLocationTh: (value: string) => void;
}

export function ActivityDetails({
  fullDetailsEn,
  setFullDetailsEn,
  fullDetailsTh,
  setFullDetailsTh,
  shortDetailsEn,
  setShortDetailsEn,
  shortDetailsTh,
  setShortDetailsTh,
  locationEn,
  setLocationEn,
  locationTh,
  setLocationTh,
}: ActivityDetailsProps) {
  return (
    <>
      <div>
        <h3 className="text-sm font-medium mb-3">Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Full Details (English)"
              minRows={4}
              placeholder="Enter full details in English"
              value={fullDetailsEn}
              onValueChange={setFullDetailsEn}
            />
            <Textarea
              label="Full Details (Thai)"
              minRows={4}
              placeholder="Enter full details in Thai"
              value={fullDetailsTh}
              onValueChange={setFullDetailsTh}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Short Details (English)"
              minRows={2}
              placeholder="Enter short details in English"
              value={shortDetailsEn}
              onValueChange={setShortDetailsEn}
            />
            <Textarea
              label="Short Details (Thai)"
              minRows={2}
              placeholder="Enter short details in Thai"
              value={shortDetailsTh}
              onValueChange={setShortDetailsTh}
            />
          </div>
        </div>
      </div>

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
    </>
  );
} 