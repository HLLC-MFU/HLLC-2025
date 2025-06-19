import { Select, SelectItem } from "@heroui/react";
import { AlertCircle } from "lucide-react";
import { Evoucher } from "@/types/evoucher";

interface Props {
  value: string;
  onChange: (evoucherId: string) => void;
  evouchers: Evoucher[];
  isDisabled: boolean;
}

export const EvoucherSelect = ({ value, onChange, evouchers, isDisabled }: Props) => {
  const handleChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    onChange(selectedKey);
  };

  const isEvoucherExpired = (evoucher: Evoucher): boolean =>
    new Date(evoucher.expiration) < new Date();

  return (
    <Select
      label="Evoucher"
      isRequired
      selectedKeys={value ? [value] : []}
      onSelectionChange={handleChange}
      isDisabled={isDisabled}
      classNames={{ trigger: "z-0" }}
    >
      {evouchers.map(e => {
        const expired = isEvoucherExpired(e);
        return (
          <SelectItem key={e._id} textValue={e.acronym} isDisabled={expired}>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={expired ? "text-danger" : ""}>{e.acronym}</span>
                {expired && (
                  <span className="text-tiny text-danger flex items-center gap-1">
                    <AlertCircle size={12} />
                    Expired
                  </span>
                )}
              </div>
              <span className="text-small text-default-400">
                Discount: {e.discount}% • Expires: {new Date(e.expiration).toLocaleDateString()}
              </span>
            </div>
          </SelectItem>
        );
      })}
    </Select>
  );
};
