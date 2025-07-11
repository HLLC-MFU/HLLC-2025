import { Tab, Tabs } from "@heroui/react";
import Image from "next/image";

import { Lang } from "@/types/lang";

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
								alt={`${lang.key} icon`} 
								height={15} 
								src={lang.icon}
								width={20}
							/>
							<span>{lang.label}</span>
						</div>
					}
				 />
			)}
		</Tabs>
	)
}