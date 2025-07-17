'use client';

import { useEffect, useState } from 'react';
import { Bell, Coins, Flower, Footprints } from 'lucide-react';
import GlassButton from '@/components/ui/glass-button';
import PretestQuestionModal from '@/components/PretestPosttest/PretestQuestionModal';
import { usePrepostQuestion } from '@/hooks/usePrePostQuestion';
import { PrepostQuestions } from '@/types/prepostQuestion';
import { addToast } from '@heroui/react';
import PosttestQuestionModal from '@/components/PretestPosttest/PosttestQuestionModal';
import useProgress from '@/hooks/useProgress';
import { useRouter } from 'next/navigation';


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
  const router = useRouter();

  const openPretestModal = () => {
    const filteredQuestions = prepostQuestion.filter(
      q => q.displayType === 'pretest',
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
      q => q.displayType === 'posttest',
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


  const handlePretestSubmit = async () => {
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
              onClick={() => router.push('/lamduan-flowers')}
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
        onSubmit={() => handlePretestSubmit()}
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
        onSubmit={() => handlePosttestSubmit()}
      />
    </div>
  );
}
