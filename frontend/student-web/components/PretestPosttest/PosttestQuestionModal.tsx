import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Input,
} from '@heroui/react';

// ปรับ type ให้รับ props เดิมของ web
interface PosttestQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prePostQuestions: any[];
  loading?: boolean;
  error?: string | null;
  answers: { posttest: string; answer: string }[];
  setAnswers: React.Dispatch<React.SetStateAction<{ posttest: string; answer: string }[]>>;
  onSubmit: () => void;
}

const pastelColors = ['#FFB3B3', '#FFD6A5', '#FFF7AE', '#C1F7C7', '#A0E7A0'];
const activeColors = ['#FF6B6B', '#FFA94D', '#FFD43B', '#51CF66', '#38D9A9'];

export default function PosttestQuestionModal({
  isOpen,
  onClose,
  prePostQuestions,
  loading = false,
  error = null,
  answers,
  setAnswers,
  onSubmit,
}: PosttestQuestionModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (id: string, value: string) => {
    setAnswers(prev => {
      const exists = prev.find(a => a.posttest === id);
      if (exists) {
        return prev.map(a => a.posttest === id ? { ...a, answer: value } : a);
      }
      return [...prev, { posttest: id, answer: value }];
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
  };

  // คำนวณจำนวนข้อที่ต้องตอบ (เฉพาะ posttest)
  const requiredCount = prePostQuestions.filter(q => q.displayType === 'posttest').length;
  const answeredCount = answers.filter(a => a.answer && a.answer.trim() !== '').length;
  const canSubmit = !loading && !submitting && requiredCount > 0 && answeredCount === requiredCount;

  return (
    <Modal isOpen={isOpen} onClose={() => {}} hideCloseButton backdrop="opaque" classNames={{backdrop:'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20'}}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Posttest Questions</ModalHeader>
        <ModalBody className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8"><Spinner size="lg" color="default" /></div>
          ) : error ? (
            <p className="text-red-500 mb-4">{error}</p>
          ) : prePostQuestions.length === 0 ? (
            <p className="mb-4">No Posttest Questions</p>
          ) : (
            prePostQuestions
              .filter(q => q.displayType === 'posttest')
              .sort((a, b) => a.order - b.order)
              .map((q, idx) => {
                const qid = q._id || q.id || idx;
                const answer = answers.find(a => a.posttest === qid)?.answer || '';
                return (
                  <div key={qid} className="mb-6">
                    <div className="font-bold mb-2">{idx + 1}. {q.question?.en || q.text?.en || '-'}</div>
                    {q.type === 'rating' ? (
                      <>
                        <div className="flex flex-row justify-center my-2">
                          {[1,2,3,4,5].map((val, i) => {
                            const isActive = answer === String(val);
                            return (
                              <button
                                key={val}
                                type="button"
                                className="mx-2 rounded-full w-10 h-10 flex items-center justify-center border"
                                style={{
                                  backgroundColor: isActive ? activeColors[i] : '#fff',
                                  borderColor: isActive ? activeColors[i] : '#ddd',
                                  borderWidth: isActive ? 2 : 1,
                                }}
                                onClick={() => handleChange(qid, String(val))}
                                disabled={submitting}
                              >
                                <span style={{ color: isActive ? '#fff' : '#333', fontWeight: 700, fontSize: 18 }}>{val}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex flex-row justify-between mx-2 mb-1">
                          <span style={{ color: '#FF6B6B', fontSize: 13 }}>Low</span>
                          <span style={{ color: '#38D9A9', fontSize: 13 }}>High</span>
                        </div>
                      </>
                    ) : q.type === 'dropdown' ? (
                      <select
                        className="border border-gray-300 rounded-lg mt-1 px-2 py-2 w-full"
                        value={answer}
                        onChange={e => handleChange(qid, e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">Select an option</option>
                        {/* TODO: ดึง options จริงจาก q.options ถ้ามี */}
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                        <option value="option3">Option 3</option>
                      </select>
                    ) : (
                      <Input
                        className="border border-gray-300 rounded-lg px-2 py-2 min-h-[36px]"
                        placeholder="Enter your answer"
                        value={answer}
                        onChange={e => handleChange(qid, e.target.value)}
                        disabled={submitting}
                      />
                    )}
                  </div>
                );
              })
          )}
        </ModalBody>
        <ModalFooter className="justify-center">
          <Button
            color="primary"
            onPress={handleSubmit}
            fullWidth
            disabled={!canSubmit}
            style={{
              backgroundColor: '#38D9A9',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              borderRadius: 12,
              height: 48,
              border: 'none',
              boxShadow: 'none',
              opacity: canSubmit ? 1 : 0.5,
              transition: 'opacity 0.2s',
              ...(!canSubmit ? { pointerEvents: 'none' } : {})
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
