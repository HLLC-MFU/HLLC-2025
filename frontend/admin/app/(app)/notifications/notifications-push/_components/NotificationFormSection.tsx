import { InformationForm } from './NotificationForm';
import { Dispatch, SetStateAction } from 'react';
import { SelectStudentType } from './NotificationSelectStudent';

type SelectionScope =
  | 'global'
  | { type: 'major' | 'school' | 'individual'; id: string[] }[];

type InformationInfoData = {
  icon?: React.ElementType;
  title: { en: string; th: string };
  subtitle: { en: string; th: string };
  body: { en: string; th: string };
  redirect: { en: string; th: string; link: string };
  imageUrl?: string;
  imageFile?: File;
};

interface NotificationFormSectionProps {
  setScope: Dispatch<SetStateAction<SelectionScope>>;
  setInfoData: Dispatch<SetStateAction<InformationInfoData | undefined>>;
  resetFormCounter: number;
}

export function NotificationFormSection({
  setScope,
  setInfoData,
  resetFormCounter,
}: NotificationFormSectionProps) {
  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col w-full px-5 py-6 gap-6 rounded-2xl border border-gray-300 shadow-md">
        <h1 className="text-2xl font-bold">Preview</h1>
        <SelectStudentType onScopeChange={setScope} />
      </div>
      <div className="flex flex-col w-full px-5 py-6 gap-6 rounded-2xl border border-gray-300 shadow-md">
        <InformationForm onChange={setInfoData} resetSignal={resetFormCounter} />
      </div>
    </div>
  );
}
