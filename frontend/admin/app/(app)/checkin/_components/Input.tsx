import { Form, Button, Input as TextInput } from '@heroui/react';

type InputProp = {
  onSubmit: () => void;
  studentId: string;
  setStudentId: (val: string) => void;
};

export default function Inputs({
  onSubmit,
  studentId,
  setStudentId,
}: InputProp) {
  return (
    <Form onSubmit={onSubmit} className="flex w-full gap-2">
      <TextInput
        isRequired
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        errorMessage="Please enter a valid 10-digit student ID"
        name="studentId"
        placeholder="Enter your student ID"
        type="text"
        maxLength={10}
      />
      <Button type="submit">Submit</Button>
    </Form>
  );
}
