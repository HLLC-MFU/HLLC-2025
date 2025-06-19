import { Interfaces } from "@/types/interfaces";
import AssetsInputField from "./AssetsInputField";

type assetsSectionProps = {
    item: { title: string }[];
    interfaces: Interfaces;
    onSave: (interfaceData: FormData) => Promise<void>;
};

export default function ImageInputField({ 
    item, 
    interfaces, 
    onSave, 
}: assetsSectionProps) {
    return (
        <div className="w-full mb-6">
            <div className="grid grid-cols-3 gap-4">
                {item.map((asset) => {
                    const key = asset.title.toLowerCase();
                    const image = interfaces.assets[key];

                    return (
                        <AssetsInputField
                            key={key}
                            title={asset.title}
                            {...(image && { image })}
                            onSave={onSave}
                        />
                    );
                })}
            </div>
        </div>
    )
};