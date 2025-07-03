import { Input, Textarea } from '@heroui/input';
import { Accordion, AccordionItem, Autocomplete, AutocompleteItem, Form } from '@heroui/react';
import * as LucideIcons from 'lucide-react';
import { Notification } from '@/types/notification';
import ImageInput from '@/components/ui/imageInput';
import { ComponentType } from 'react';

type NotificationFormProps = {
  notification: Notification;
  onChange: React.Dispatch<React.SetStateAction<Notification>>;
  onSubmit: () => void;
};

export function NotificationForm({ notification, onChange, onSubmit }: NotificationFormProps) {
  const allLucideIcons = Object.keys(LucideIcons)
    .map(iconName => ({
      value: iconName,
      label: iconName,
      icon: LucideIcons[iconName as keyof typeof LucideIcons] as ComponentType<LucideIcons.LucideProps>,
    }))

  const handleImageChange = (file: File) => {
    onChange((prev) => ({
      ...prev,
      image: file,
      imageURL: URL.createObjectURL(file),
    }));
  };

  const handleImageCancel = () => {
     onChange((prev) => ({
      ...prev,
      image: undefined,
      imageURL: undefined,
    }));
  }

  const anyRedirectFilled = !!(
    notification.redirectButton?.label.en?.trim() ||
    notification.redirectButton?.label.th?.trim() ||
    notification.redirectButton?.url?.trim()
  );

  return (
    <Form 
      id='notification-form' 
      className="flex flex-col gap-4" 
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-row justify-between w-full">
        <h1 className="text-xl font-bold">
          Notification Form
        </h1>
        <div className=" w-full max-w-56 h-full">

          <Autocomplete
            isRequired
            label="Notification Icon"
            placeholder="Select Icon"
            size='sm'
            defaultItems={allLucideIcons}
            onSelectionChange={keys => {
              const iconItem = allLucideIcons.find(icon => icon.value === keys);
              onChange({ ...notification, icon: iconItem ? iconItem.value : '' });
            }}
          >
            {(icon) => {
              const Icon = icon.icon;
              return (
                <AutocompleteItem key={icon.value} startContent={<Icon className="w-5 h-5" />}>
                  {icon.label}
                </AutocompleteItem>
              );
            }}
          </Autocomplete>

        </div>
      </div>

      <div className="flex flex-row gap-4 w-full">
        <Input
          isRequired
          label="Title (English)"
          placeholder="Enter title in English"
          value={notification.title.en}
          onChange={e => onChange({ ...notification, title: { ...notification.title, en: e.target.value } })}
        />

        <Input
          isRequired
          label="Title (Thai)"
          placeholder="Enter title in Thai"
          value={notification.title.th}
          onChange={e => onChange({ ...notification, title: { ...notification.title, th: e.target.value } })}
        />
      </div>

      <div className="flex flex-row gap-4 w-full">
        <Input
          isRequired
          label="Subtitle (English)"
          placeholder="Enter subtitle in English"
          value={notification.subtitle.en}
          onChange={e => onChange({ ...notification, subtitle: { ...notification.subtitle, en: e.target.value } })}
        />

        <Input
          isRequired
          label="Subtitle (Thai)"
          placeholder="Enter subtitle in Thai"
          value={notification.subtitle.th}
          onChange={e => onChange({ ...notification, subtitle: { ...notification.subtitle, th: e.target.value } })}
        />
      </div>

      <div className="flex flex-row gap-4 items-stretch w-full">
        <div className="w-full h-full">
          <Textarea
            isRequired
            label="Description (English)"
            placeholder="Enter description in English"
            value={notification.body.en}
            minRows={6}
            onChange={e => onChange({ ...notification, body: { ...notification.body, en: e.target.value } })}
          />
        </div>
        <div className="w-full h-full">
          <Textarea
            isRequired
            label="Description (Thai)"
            placeholder="Enter description in Thai"
            value={notification.body.th}
            minRows={6}
            onChange={e => onChange({ ...notification, body: { ...notification.body, th: e.target.value } })}
          />
        </div>
      </div>

      <Accordion variant="shadow" selectionMode="multiple">
        <AccordionItem 
          key="1"
          title="Redirect Button (Optional)"
          startContent={
            <LucideIcons.Link width={20} height={20} />
          }
          subtitle="Button to redirect users to a specific link."
        >
          <div className="flex flex-col gap-4 pb-3">
            <div className='flex flex-row gap-4'>
              <Input
                isRequired={anyRedirectFilled}
                label="Label (English)"
                placeholder="Enter label in English"
                value={notification.redirectButton?.label.en}
                onChange={e => onChange({ 
                  ...notification, 
                  redirectButton: { 
                    url: notification.redirectButton?.url ?? '', 
                    label: { 
                      th: notification.redirectButton?.label?.th ?? '', 
                      en: e.target.value 
                    } 
                  } 
                })} 
              />

              <Input
                isRequired={anyRedirectFilled}
                label="Label (Thai)"
                placeholder="Enter label in Thai"
                value={notification.redirectButton?.label.th}
                onChange={e => onChange({ 
                  ...notification, 
                  redirectButton: { 
                    url: notification.redirectButton?.url ?? '', 
                    label: { 
                      en: notification.redirectButton?.label?.en ?? '', 
                      th: e.target.value 
                    } 
                  } 
                })}
              />
            </div>

            <Input
              isRequired={anyRedirectFilled}
              label="URL Link"
              placeholder="Enter URL link"
              type="url"
              value={notification.redirectButton?.url}
              onChange={e => onChange({ 
                ...notification, 
                redirectButton: {
                  label: notification.redirectButton?.label ?? { th: '', en: '' },
                  url: e.target.value,
                },
              })}
            />
          </div>
        </AccordionItem>
        <AccordionItem
          key="2"
          title="Image (Optional)"
          startContent={
            <LucideIcons.Image width={20} height={20} />
          }
          subtitle="Image to display in notification."
        >
          <div className='pb-3 sm:w-full md:w-80'>
            <ImageInput
              title={'Notification Image'}
              onChange={handleImageChange}
              onCancel={handleImageCancel}
            />
          </div>
        </AccordionItem>
      </Accordion>
    </Form>
  );
}