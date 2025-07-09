'use client';
import type { Selection } from '@heroui/react';
import { useReports } from '@/hooks/useReports';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from '@heroui/react';
import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();

  const user = useProfile(stats => stats.user?._id);
  const { reportTypes, createReports } = useReports();

  const [selectReportTypes, setSelectReportTypes] = useState<Selection>(
    new Set([]),
  );
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [message, setMessage] = useState('');

  const handleSubmit = async (onClose: () => void) => {
    await createReports({
      reporter: user,
      category: Array.from(selectReportTypes)[0] as string,
      message: message,
    });

    setMessage('');
    setSelectReportTypes(new Set([]));
    onClose();
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-[url('/lobby.png')] bg-cover bg-center">
      <Card className="flex p-3 w-full h-fit bg-background/25 backdrop-blur-sm shadow-lg rounded-xl mx-6">
        <CardHeader>
          <h1 className="text-2xl font-semibold"> Reports </h1>
        </CardHeader>
        <CardBody className="flex space-y-3">
          <Select
            isRequired
            label="ReportType"
            selectedKeys={selectReportTypes}
            className="w-full py-2"
            placeholder="Select Type"
            onSelectionChange={setSelectReportTypes}
            variant="faded"
            radius="sm"
            maxListboxHeight={200}
            itemHeight={16}
          >
            {reportTypes.map(reportType => (
              <SelectItem key={reportType._id} textValue={reportType.name.en}>
                <h1 className="text-medium text-default-800">
                  {reportType.name.en}
                </h1>
              </SelectItem>
            ))}
          </Select>

          <Textarea
            disableAutosize
            isRequired
            label="Message"
            classNames={{
              base: 'min-w-full',
              input: 'min-h-[100px]',
            }}
            placeholder="Write a message"
            value={message}
            onValueChange={setMessage}
          />
        </CardBody>
        <CardFooter className="justify-between gap-8">
          <Button
            color="danger"
            className="w-full"
            onPress={() => router.back()}
          >
            Back
          </Button>
          <Button
            type="submit"
            color="primary"
            className="w-full"
            onPress={onOpen}
            isDisabled={
              Array.from(selectReportTypes).length === 0 ||
              message.trim() === ''
            }
          >
            Submit
          </Button>
        </CardFooter>
      </Card>

      <Modal
        isOpen={isOpen}
        placement="center"
        onOpenChange={onOpenChange}
        backdrop="opaque"
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: 'easeOut',
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: 'easeIn',
              },
            },
          },
        }}
      >
        <ModalContent className="mx-6">
          {onClose => (
            <>
              <ModalHeader className="flex gap-1">Confirm Report</ModalHeader>
              <ModalBody>
                <h1 className='text-sm text-default-500'> ReportType</h1>
                <Button isDisabled>
                  {reportTypes.find(rt => rt._id === Array.from(selectReportTypes)[0])?.name.en || '-'}
                </Button>
                <Textarea
                  isDisabled
                  className="w-full"
                  defaultValue={message}
                  label="Message"
                  labelPlacement="outside"
                  placeholder="Enter your Message"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={() => handleSubmit(onClose)}>
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
