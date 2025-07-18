import { Dispatch, SetStateAction } from 'react';
import { Accordion, AccordionItem, Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
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
    background: string[];
    header: string[];
    navigation: string[];
    menu: string[];
    profile: string[];
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
          <div className="grid gap-4 w-full">
            <Accordion selectionMode="multiple">
              {Object.entries(uiSection).map(([group, groupAssets]) => (
                <AccordionItem
                  key={group}
                  aria-label={group}
                  title={group[0].toUpperCase() + group.slice(1)}
                  subtitle={
                    <>
                      <span className="text-primary">{groupAssets.length} assets </span>
                      <span>in this category</span>
                    </>
                  }
                  keepContentMounted
                  className="font-semibold capitalize hover:bg-default-100 rounded-lg px-4 my-2"
                >
                  <div key={group} className="grid grid-cols-3 gap-4">
                    {groupAssets.map((asset) => {
                      const key = asset.toLowerCase();
                      const image = appearance.assets[key];

                      const handleChange = (file: File) => {
                        onSetAssets((prev) => ({
                          ...prev,
                          [asset]: file,
                        }));
                      };

                      return (
                        <div
                          key={key}
                          className={`${asset === 'Background' && 'col-span-full'}`}
                        >
                          <ImageInput
                            aspectRatio={
                              asset === 'Background'
                                ? 'aspect-[16/9]'
                                : 'aspect-square'
                            }
                            fileAccept={
                              asset === 'Background'
                                ? 'video/mp4, image/*'
                                : 'image/*'
                            }
                            image={image}
                            sizeLimit={
                              asset === 'Background'
                                ? 5 * 1024 * 1024
                                : 500 * 1024
                            }
                            title={asset}
                            onCancel={() => {
                              onSetAssets((prev) => {
                                const updated = { ...prev };

                                delete updated[asset];

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
                </AccordionItem>
              ))}
            </Accordion>

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
