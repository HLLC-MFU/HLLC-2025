import { useCheckin } from '@/hooks/useCheckin';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { addToast, Form } from '@heroui/react';
import { User } from 'lucide-react';
import { useState } from 'react';

interface CheckinTyping {
    selectedActivityIds: string[];
}

export function CheckinTyping ({selectedActivityIds}: CheckinTyping) {
  const { createcheckin } = useCheckin();
  const [studentId, setStudentId] = useState('');

  const onSubmit = async (e: any) => {
    e.preventDefault();

    try {
      await createcheckin({
        user: studentId,
        activities: selectedActivityIds,
      });

      addToast({
        title: 'Checkin Finish',
        color: 'success',
      });

      setStudentId('');
    } catch (error: any) {
      if (error?.response?.status === 400) {
        addToast({
          title: 'This User is checkin this activty ',
          color: 'warning',
        });
      }

      addToast({
        title: 'Checkin Activity Fail',
        color: 'danger',
      });
    }
  };

  return (
    <>
      <Form className="w-full space-y-3" onSubmit={onSubmit}>
        <Input
          label="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          labelPlacement="outside"
          startContent={
            <User className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
          }
          type="text"
        />

        <Button color="primary" type="submit" className='w-full'>
          Submit
        </Button>
      </Form>
    </>
  );
}
