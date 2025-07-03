import { useCheckin } from '@/hooks/useCheckin';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Form } from '@heroui/react';
import { User } from 'lucide-react';
import { useState } from 'react';

interface CheckinTyping {
    selectedActivityIds: string[];
}

export function CheckinTyping ({selectedActivityIds}: CheckinTyping) {
  const { createCheckin } = useCheckin();
  const [ studentId, setStudentId] = useState('');

  const onSubmit = async (e: any) => {
    e.preventDefault();
    await createCheckin({
      user: studentId,
      activities: selectedActivityIds,
    });

    setStudentId('');
  };

  return (
    <>
      <Form className="w-full space-y-3" onSubmit={onSubmit}>
        <Input
          label="Student ID"
          placeholder='Enter Student ID'
          validate={(value) => {
            if (value.length !== 10) {
              return 'Student ID must have 10 characters';
            }
            if ( selectedActivityIds.length === 0 ) {
              return 'Please select activities';
            }
            return null;
          }}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          labelPlacement="outside"
          startContent={
            <User className="text-2xl pointer-events-none flex-shrink-0" />
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
