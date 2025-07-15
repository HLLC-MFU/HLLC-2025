import { PrepostQuestions } from '@/types/prepostQuestion';
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

type PretestQuestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  prePostQuestions: PrepostQuestions[];
  answers: { pretest: string; answer: string }[];
  setAnswers: React.Dispatch<
    React.SetStateAction<{ pretest: string; answer: string }[]>
  >;
  onSubmit: () => void;
};

export default function PretestQuestionModal({
  isOpen,
  onClose,
  prePostQuestions,
  answers,
  setAnswers,
  onSubmit,
}: PretestQuestionModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleValidationSubmit = () => {
    const newErrors: Record<string, string> = {};

    prePostQuestions.forEach(p => {
      const answer = answers.find(ans => ans.pretest === p._id)?.answer;

      if (!answer || answer.trim() === '') {
        newErrors[p._id] = 'This field is required.';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast({
        title: 'Please Answer All Pretest Before Submit.',
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
            Pretest Questions
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            {prePostQuestions.length === 0 ? (
              <p>Pretest Questions Loading ...</p>
            ) : (
              prePostQuestions
                .filter(p => p.displayType === 'pretest' || p.displayType === 'both')
                .map(p => (
                  <Form key={p._id} className="flex flex-col gap-4">
                    <p className="font-bold">
                      {p.order}. {p.question.en}
                    </p>

                    {p.type === 'text' && (
                      <Input
                        isRequired
                        errorMessage={errors[p._id]}
                        isInvalid={!!errors[p._id]}
                        label="Your Answer"
                        labelPlacement="outside"
                        placeholder="Enter your answer"
                        value={
                          answers.find(ans => ans.pretest === p._id)?.answer ||
                          ''
                        }
                        onChange={e => {
                          const updated = answers.map(ans =>
                            ans.pretest === p._id
                              ? { ...ans, answer: e.target.value }
                              : ans,
                          );
                          setAnswers(updated);
                        }}
                      />
                    )}

                    {p.type === 'rating' && (
                      <>
                        <RadioGroup
                          label="Select your satisfaction"
                          orientation="horizontal"
                          value={
                            answers.find(ans => ans.pretest === p._id)
                              ?.answer || ''
                          }
                          onValueChange={val => {
                            const updated = answers.map(ans =>
                              ans.pretest === p._id
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
                        {errors[p._id] && (
                          <p className="text-red-500 text-sm">{errors[p._id]}</p>
                        )}
                      </>
                    )}

                    {p.type !== 'text' && p.type !== 'rating' && (
                      <p className="text-sm text-gray-500">
                        Unsupported: {p.type}
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
