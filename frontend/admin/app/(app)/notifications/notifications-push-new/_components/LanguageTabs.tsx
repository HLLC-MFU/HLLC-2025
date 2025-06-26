import { Lang } from "@/types/lang";
import { Tab, Tabs } from "@heroui/react";
import Image from "next/image";

type LanguageTabsProps = {
	languageOptions: { key: keyof Lang; label: string; icon: string }[];
	previewLanguage: keyof Lang;
	setPreviewLanguage: (language: keyof Lang) => void;
}

export default function LanguageTabs({ languageOptions, previewLanguage, setPreviewLanguage }: LanguageTabsProps) {
	return (
		<Tabs 
			items={languageOptions}
			selectedKey={previewLanguage}
			onSelectionChange={(key) => setPreviewLanguage(key as keyof Lang)}
		>
			{(lang) => (
				<Tab
					key={lang.key}
					title={
						<div className="flex items-center space-x-2">
							<Image 
								src={lang.icon} 
								alt={`${lang.key} icon`} 
								width={20}
								height={15}
							/>
							<span>{lang.label}</span>
						</div>
					}
				>
				</Tab>
			)}
		</Tabs>
	)
}