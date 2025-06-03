import React from 'react';
import { Button, Sheet, YStack, XStack, SizableText } from 'tamagui';
import { Province } from '@/types/auth';

interface ProvinceSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  provinces: Province[];
  selectedProvince: string;
  onSelect: (province: string) => void;
}

export const ProvinceSelector: React.FC<ProvinceSelectorProps> = ({
  isOpen,
  onOpenChange,
  provinces,
  selectedProvince,
  onSelect,
}) => {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={[90]}
      position={0}
      dismissOnSnapToBottom
      modal
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$4">
        <Sheet.Handle />
        <YStack space="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <SizableText fontSize={24} fontWeight="bold">เลือกจังหวัด</SizableText>
            <Button onPress={() => onOpenChange(false)} chromeless>
              <XStack space="$2" alignItems="center">
                <SizableText>ปิด</SizableText>
              </XStack>
            </Button>
          </XStack>

          <YStack space="$2">
            {provinces.map((province) => (
              <Button
                key={province.id}
                onPress={() => {
                  onSelect(province.name_en);
                  onOpenChange(false);
                }}
                backgroundColor={selectedProvince === province.name_en ? '$colorFocus' : 'white'}
                borderWidth={1}
                borderColor="$borderColor"
              >
                <SizableText
                  color={selectedProvince === province.name_en ? 'white' : '$color'}
                >
                  {province.name_th}
                </SizableText>
              </Button>
            ))}
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}; 