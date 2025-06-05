import { Switch } from "@heroui/react";

interface ActivitySettingsProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  isProgressCount: boolean;
  setIsProgressCount: (value: boolean) => void;
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
}

export function ActivitySettings({
  isOpen,
  setIsOpen,
  isProgressCount,
  setIsProgressCount,
  isVisible,
  setIsVisible,
}: ActivitySettingsProps) {
  return (
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
  );
} 