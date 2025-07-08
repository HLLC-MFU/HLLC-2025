import React, { useRef, useCallback, useEffect } from "react";
import { Button, YStack, XStack, SizableText, Text } from "tamagui";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { Province } from "@/types/auth";
import { useTranslation } from "react-i18next";

interface ProvinceSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  provinces: Province[];
  selectedProvince: string;
  onSelect: (province: string) => void;
}

export const ProvinceSelector = ({
  isOpen,
  onOpenChange,
  provinces,
  selectedProvince,
  onSelect,
}: ProvinceSelectorProps) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.present();  // เรียก present() เพื่อเปิด modal
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  // ฟังเหตุการณ์เปลี่ยนสถานะ bottom sheet
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );
  const {t} = useTranslation();

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0} // เริ่มปิดก็ใช้ -1 แต่ถ้จะให้พร้อมเปิดตั้งแต่แรกใช้ 0
      snapPoints={["90%"]} // ความสูงของ modal ปรับได้ตามชอบ
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      enablePanDownToClose
    >
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$4" paddingHorizontal="$4">
        <Text fontSize={24} fontWeight="bold">
          Select Province
        </Text>
        <Button
          onPress={() => {
            bottomSheetRef.current?.close();
            onOpenChange(false);
          }}
          chromeless
        >
          {t("global.close")}
        </Button>
      </XStack>

      <BottomSheetScrollView style={{ flex: 1, padding: 16 }}>

        <YStack gap="$2">
          {provinces.map((province) => {
            const isSelected = selectedProvince === province.name_en;
            return (
              <Button
                key={province.id}
                onPress={() => {
                  onSelect(province.name_en);
                  bottomSheetRef.current?.close();
                  onOpenChange(false);
                }}
                backgroundColor={isSelected ? "$colorFocus" : "white"}
                borderWidth={1}
                borderColor="$borderColor"
              >
                <SizableText color={isSelected ? "white" : "$color"}>
                  {province.name_en}
                </SizableText>
              </Button>
            );
          })}
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};
