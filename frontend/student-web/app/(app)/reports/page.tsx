'use client';
import type { Selection } from '@heroui/react';
import { useReports } from '@/hooks/useReports';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Form,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();

  const user = useProfile(stats => stats.user?._id);
  const { reportTypes, createReports } = useReports();

  const [selectReportTypes, setSelectReportTypes] = useState<Selection>(new Set([]),);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createReports({
      reporter: user,
      category: Array.from(selectReportTypes)[0] as string,
      message: message,
    });

    setMessage('');
    setSelectReportTypes(new Set([]));
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-[url('/lobby.png')] bg-cover bg-center ">
      <Form
        className="flex justify-center items-center w-full h-full px-6"
        onSubmit={handleSubmit}
      >
        <Card className="flex p-3 w-full h-fit bg-background/25 backdrop-blur-sm shadow-lg rounded-xl">
          <CardHeader>
            <h1 className="text-2xl font-semibold"> Reports </h1>
          </CardHeader>
          <CardBody className="flex space-y-3">
            <Select
              isRequired
              label="ReportType"
              selectedKeys={selectReportTypes}
              className="w-full py-2"
              placeholder="Select ReportType"
              onSelectionChange={setSelectReportTypes}
              variant="faded"
              radius="sm"
              maxListboxHeight={200}
              itemHeight={16}
            >
              {reportTypes.map(reportType => (
                <SelectItem key={reportType._id} textValue={reportType.name.en}>
                  <h1 className='text-medium text-default-800'>{reportType.name.en}</h1>
                </SelectItem>
              ))}
            </Select>

            <Textarea
              disableAutosize
              isRequired
              label="Message"
              classNames={{
                base: ' min-w-full ',
                input: 'min-h-[100px] bg-red',
              }}
              value={message}
              onValueChange={setMessage}
            />
          </CardBody>
          <CardFooter className=" justify-between gap-8">
            <Button
              color="danger"
              className="w-full"
              onPress={() => router.back()}
            >
              Back
            </Button>
            <Button type="submit" color="primary" className="w-full">
              Submit
            </Button>
          </CardFooter>
        </Card>
      </Form>
    </div>
  );
}
