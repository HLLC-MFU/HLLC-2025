'use client';

import { useEffect, useState } from 'react';
import { Bell, Coins, Flower, Footprints } from 'lucide-react';
import GlassButton from '@/components/ui/glass-button';
import { ConfirmationModal } from '@/components/PretestPosttest/ConfirmModal';
import PretestQuestionModal from '@/components/PretestPosttest/PretestQuestionModal';
import { usePrepostQuestion } from '@/hooks/usePrePostQuestion';
import { PrepostQuestions } from '@/types/prepostQuestion';
import { addToast } from '@heroui/react';
import PosttestQuestionModal from '@/components/PretestPosttest/PosttestQuestionModal';
import useProgress from '@/hooks/useProgress';


const baseImageUrl = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const {
    pretestAnswersInput,
    posttestAnswersInput,
    createPretestAnswers,
    createPosttestAnswers,
    fetchPrepostQuestion,
    fetchPretestAnswers,
    setPretestAnswersInput,
    setPosttestAnswersInput,
    prepostQuestion,
    hasPretestAnswers,
    hasPosttestAnswers,
  } = usePrepostQuestion();
  const { progress } = useProgress();
  const [isPretestModalOpen, setIsPretestModalOpen] = useState(false);
  const [isPosttestModalOpen, setIsPosttestModalOpen] = useState(false);
  const [selectedPretestQuestions, setSelectedPretestQuestions] = useState<PrepostQuestions[]>([]);
  const [selectedPosttestQuestions, setSelectedPosttestQuestions] = useState<PrepostQuestions[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPosttestConfirmOpen, setIsPosttestConfirmOpen] = useState(false);

  const openPretestModal = () => {
    const filteredQuestions = prepostQuestion.filter(
      q => q.displayType === 'pretest' || q.displayType === 'both',
    );
    setSelectedPretestQuestions(filteredQuestions);
    const initialAnswers = filteredQuestions.map(q => {
      const existingAnswer = pretestAnswersInput.find(ans => ans.pretest === q._id);
      return existingAnswer || { pretest: q._id, answer: '' };
    });
    setPretestAnswersInput(initialAnswers);
    setIsPretestModalOpen(true);
  };

  const openPosttestModal = () => {
    const filteredQuestions = prepostQuestion.filter(
      q => q.displayType === 'posttest' || q.displayType === 'both',
    );
    setSelectedPosttestQuestions(filteredQuestions);

    const initialAnswers = filteredQuestions.map(q => {
      const existingAnswer = posttestAnswersInput.find(ans => ans.posttest === q._id);
      return existingAnswer || { posttest: q._id, answer: '' };
    });

    setPosttestAnswersInput(initialAnswers);
    setIsPosttestModalOpen(true);
  };

  // ✅ เปิด Pretest modal ถ้าไม่มีคำตอบ
  useEffect(() => {
    if (hasPretestAnswers === false) {
      openPretestModal();
    }
  }, [hasPretestAnswers]);

  // ✅ เปิด Posttest modal เมื่อเงื่อนไขครบ
  useEffect(() => {
    if (
      hasPretestAnswers &&
      (progress?.progressPercentage ?? 0) >= 80 &&
      hasPosttestAnswers === false
    ) {
      openPosttestModal();
    }
  }, [hasPretestAnswers, hasPosttestAnswers, progress?.progressPercentage]);


  const handleSubmit = async () => {
    if (!pretestAnswersInput || pretestAnswersInput.length === 0) {
      addToast({
        title: 'No Answer to Submit.',
        color: 'danger',
      });

      return;
    }

    try {
      const payload = {
        answers: pretestAnswersInput.map(ans => ({
          pretest: ans.pretest,
          answer: ans.answer,
        })),
      };

      const res = await createPretestAnswers(payload);

      if (res) {
        addToast({
          title: 'Submit Successfully.',
          color: 'success',
        });
        await fetchPrepostQuestion();
        await fetchPretestAnswers();
        setIsPretestModalOpen(false);
        setSelectedPretestQuestions([]);
        await fetchPrepostQuestion();
      } else {
        addToast({
          title: 'Failed to Submit Answer.',
          color: 'danger',
        });
      }
    } catch (err) {
      addToast({
        title: 'Error Submit Answer.',
        color: 'danger',
      });
    }
  };

  const handlePosttestSubmit = async () => {
    if (!posttestAnswersInput || posttestAnswersInput.length === 0) {
      addToast({
        title: 'No Answer to Submit.',
        color: 'danger',
      });
      return;
    }

    try {
      const payload = {
        answers: posttestAnswersInput.map(ans => ({
          posttest: ans.posttest,
          answer: ans.answer,
        })),
      };

      const res = await createPosttestAnswers(payload);

      if (res) {
        addToast({
          title: 'Submit Successfully.',
          color: 'success',
        });
        await fetchPrepostQuestion();
        setIsPosttestModalOpen(false);
        setSelectedPosttestQuestions([]);
      } else {
        addToast({
          title: 'Failed to Submit Answer.',
          color: 'danger',
        });
      }
    } catch (err) {
      addToast({
        title: 'Error Submit Answer.',
        color: 'danger',
      });
    }
  };

  const handleConfirmModal = async () => {
    await handleSubmit();
    setIsConfirmOpen(false);
  };

  const steps = 9000;
  // const progressLoading = false;
  const deviceMismatch = false;

  const assetsImage = {
    lamduan: null,
    profile: null,
    notification: null,
    background: null,
    progress: null,
  };


  return (
    <div
      className="relative flex flex-col max-h-full w-full bg-cover bg-center bg-no-repeat text-white px-4 pt-6 md:pt-12 pb-28"
      style={{
        backgroundImage: `url(${baseImageUrl}/uploads/${assetsImage.background || 'default-bg.jpg'})`,
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-2">
          <GlassButton iconOnly>
            <Flower
              className="text-white"
              size={20}
              onClick={() => (window.location.href = '/lamduanflowers')}
            />
          </GlassButton>
          <GlassButton
            iconOnly
            onClick={() => setNotificationModalVisible(true)}
          >
            <Bell className="text-white" size={20} />
          </GlassButton>
        </div>
      </div>

      <PretestQuestionModal
        answers={pretestAnswersInput}
        prePostQuestions={selectedPretestQuestions}
        isOpen={isPretestModalOpen}
        setAnswers={setPretestAnswersInput}
        onClose={() => {
          if (hasPretestAnswers === false) {
            addToast({
              title: 'You must complete the pretest first.',
              color: 'warning',
            });
            return;
          }
          setIsPretestModalOpen(false);
          setSelectedPretestQuestions([]);
        }}
        onSubmit={() => setIsConfirmOpen(true)}
      />

      <PosttestQuestionModal
        answers={posttestAnswersInput}
        prePostQuestions={selectedPosttestQuestions}
        isOpen={isPosttestModalOpen}
        setAnswers={setPosttestAnswersInput}
        onClose={() => {
          if (hasPosttestAnswers === false) {
            addToast({
              title: 'You must complete the posttest first.',
              color: 'warning',
            });
            return;
          }
          setIsPosttestModalOpen(false);
          setSelectedPosttestQuestions([]);
        }}
        onSubmit={() => setIsPosttestConfirmOpen(true)}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        subtitle="Are you sure you want to submit your answers? You won't be able to change them after submission."
        title="Do you want to submit your answers?"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmModal}
      />

      <ConfirmationModal
        isOpen={isPosttestConfirmOpen}
        subtitle="Are you sure you want to submit your POSTTEST answers? You won't be able to change them after submission."
        title="Do you want to submit your POSTTEST answers?"
        onClose={() => setIsPosttestConfirmOpen(false)}
        onConfirm={async () => {
          await handlePosttestSubmit();
          setIsPosttestConfirmOpen(false);
        }}
      />
    </div>
  );
}
