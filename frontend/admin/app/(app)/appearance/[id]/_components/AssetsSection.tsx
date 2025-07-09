import { Dispatch, SetStateAction } from 'react';
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { Ban, Image } from 'lucide-react';

import { Appearance } from '@/types/appearance';
import ImageInput from '@/components/ui/imageInput';

export default function AssetsSection({
  uiSection,
  appearance,
  assets,
  onSetAssets,
  onSave,
}: {
  uiSection: {
    header: {
      title: string;
    }[];
    navigation: {
      title: string;
    }[];
  };
  appearance: Appearance;
  assets: Record<string, File>;
  onSetAssets: Dispatch<SetStateAction<Record<string, File>>>;
  onSave: () => void;
}) {
  return (
    <>
      <Card className="p-2">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start">
              <h2 className="text-xl font-semibold">Assets</h2>
              <p className="text-sm">Image and icons</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-10 w-full">
            {Object.entries(uiSection).map(([group, groupAssets]) => (
              <div key={group}>
                <p className="text-xl font-semibold">
                  {group[0].toUpperCase() + group.slice(1)}
                </p>
                <Divider className="my-4" />
                <div key={group} className="grid grid-cols-3 gap-4">
                  {groupAssets.map((asset) => {
                    const key = asset.title.toLowerCase();
                    const image = appearance.assets[key];

                    const handleChange = (file: File) => {
                      onSetAssets((prev) => ({
                        ...prev,
                        [asset.title]: file,
                      }));
                    };

                    return (
                      <div
                        key={key}
                        className={`${asset.title === 'Background' && 'col-span-full'}`}
                      >
                        <ImageInput
                          aspectRatio={
                            asset.title === 'Background'
                              ? 'aspect-[16/9]'
                              : 'aspect-square'
                          }
                          fileAccept={
                            asset.title === 'Background'
                              ? 'video/mp4, image/*'
                              : 'image/*'
                          }
                          image={image}
                          sizeLimit={
                            asset.title === 'Background'
                              ? 5 * 1024 * 1024
                              : 500 * 1024
                          }
                          title={asset.title}
                          onCancel={() => {
                            onSetAssets((prev) => {
                              const updated = { ...prev };

                              delete updated[asset.title];

                              return updated;
                            });
                          }}
                          onChange={handleChange}
                          onDiscard={Object.keys(assets).length === 0}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <div className="flex justify-between gap-4">
                <Button
                  className="px-8 font-semibold"
                  color="danger"
                  isDisabled={Object.keys(assets).length > 0 ? false : true}
                  size="lg"
                  startContent={<Ban className="w-5 h-5" />}
                  variant="light"
                  onPress={() => onSetAssets({})}
                >
                  Discard All
                </Button>
                <Button
                  className="px-8 font-semibold"
                  color="primary"
                  isDisabled={Object.keys(assets).length > 0 ? false : true}
                  size="lg"
                  startContent={<Image className="w-5 h-5" />}
                  onPress={onSave}
                >
                  Save Asset
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
