import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Input,
  Radio,
  RadioGroup,
  addToast,
} from '@heroui/react';
import { useState } from 'react';

import { Assessment } from '@/types/assessment';

type AssessmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment[];
  answers: { assessment: string; answer: string }[];
  setAnswers: React.Dispatch<
    React.SetStateAction<{ assessment: string; answer: string }[]>
  >;
  onSubmit: () => void;
};

export default function AssessmentModal({
  isOpen,
  onClose,
  assessment,
  answers,
  setAnswers,
  onSubmit,
}: AssessmentModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleValidationSubmit = () => {
    const newErrors: Record<string, string> = {};

    assessment.forEach(a => {
      const answer = answers.find(ans => ans.assessment === a._id)?.answer;

      if (!answer || answer.trim() === '') {
        newErrors[a._id] = 'This field is required.';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast({
        title: 'Please Answer All Assessment Before Submit.',
        color: 'warning',
      });

      return;
    }

    setErrors({});
    onSubmit();
  };

  return (
    <Modal
      backdrop="opaque"
      classNames={{
        backdrop:
          'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20',
      }}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            Assessment Questions
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            {assessment.length === 0 ? (
              <p>Assessment Loading ...</p>
            ) : (
              assessment.map(a => (
                <Form key={a._id} className="flex flex-col gap-4">
                  <p className="font-bold">
                    {a.order}.{a.question.en}
                  </p>

                  {a.type === 'text' && (
                    <Input
                      isRequired
                      errorMessage={errors[a._id]}
                      isInvalid={!!errors[a._id]}
                      label="Your Answer"
                      labelPlacement="outside"
                      placeholder="Enter your answer"
                      value={
                        answers.find(ans => ans.assessment === a._id)?.answer ||
                        ''
                      }
                      onChange={e => {
                        const updated = answers.map(ans =>
                          ans.assessment === a._id
                            ? { ...ans, answer: e.target.value }
                            : ans,
                        );

                        setAnswers(updated);
                      }}
                    />
                  )}

                  {a.type === 'rating' && (
                    <>
                      <RadioGroup
                        label="Select your satisfaction"
                        orientation="horizontal"
                        value={
                          answers.find(ans => ans.assessment === a._id)
                            ?.answer || ''
                        }
                        onValueChange={val => {
                          const updated = answers.map(ans =>
                            ans.assessment === a._id
                              ? { ...ans, answer: val }
                              : ans,
                          );

                          setAnswers(updated);
                        }}
                      >
                        <Radio value="1">1</Radio>
                        <Radio value="2">2</Radio>
                        <Radio value="3">3</Radio>
                        <Radio value="4">4</Radio>
                        <Radio value="5">5</Radio>
                      </RadioGroup>
                      {errors[a._id] && (
                        <p className="text-red-500 text-sm">{errors[a._id]}</p>
                      )}
                    </>
                  )}

                  {a.type !== 'text' && a.type !== 'rating' && (
                    <p className="text-sm text-gray-500">
                      Unsupported: {a.type}
                    </p>
                  )}
                </Form>
              ))
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" onPress={handleValidationSubmit}>
              Submit
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
