'use client';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

import BottomNav from '@/components/bottom-nav';
import lobby from '@/public/lobby_6.jpeg';
import ProgressBar from '@/components/ui/progressBar';
import SSEListener from '@/components/SSEListener';
import { useAppearances } from '@/hooks/useAppearances';
import { useProfile } from '@/hooks/useProfile';
import PretestQuestionModal from '@/components/PretestPosttest/PretestQuestionModal';
import PosttestQuestionModal from '@/components/PretestPosttest/PosttestQuestionModal';
import { usePrepostQuestion } from '@/hooks/usePrePostQuestion';
import { useSseStore } from '@/stores/useSseStore';
import { addToast } from '@heroui/react';
import { useState, useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { fetchUser } = useProfile();
  const { assets } = useAppearances();
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
    posttestDueDate, // <-- เพิ่มตรงนี้
  } = usePrepostQuestion();
  const progress = useSseStore(state => state.progress);

  const [isPretestModalOpen, setIsPretestModalOpen] = useState(false);
  const [isPosttestModalOpen, setIsPosttestModalOpen] = useState(false);
  const [selectedPretestQuestions, setSelectedPretestQuestions] = useState<any[]>([]);
  const [selectedPosttestQuestions, setSelectedPosttestQuestions] = useState<any[]>([]);

  const openPretestModal = () => {
    const filteredQuestions = prepostQuestion.filter(q => q.displayType === 'pretest');
    setSelectedPretestQuestions(filteredQuestions);
    const initialAnswers = filteredQuestions.map(q => {
      const existingAnswer = pretestAnswersInput.find(ans => ans.pretest === q._id);
      return existingAnswer || { pretest: q._id, answer: '' };
    });
    setPretestAnswersInput(initialAnswers);
    setIsPretestModalOpen(true);
  };

  const openPosttestModal = () => {
    const filteredQuestions = prepostQuestion.filter(q => q.displayType === 'posttest');
    setSelectedPosttestQuestions(filteredQuestions);
    const initialAnswers = filteredQuestions.map(q => {
      const existingAnswer = posttestAnswersInput.find(ans => ans.posttest === q._id);
      return existingAnswer || { posttest: q._id, answer: '' };
    });
    setPosttestAnswersInput(initialAnswers);
    setIsPosttestModalOpen(true);
  };

  useEffect(() => {
    if (hasPretestAnswers === false) {
      openPretestModal();
    }
  }, [hasPretestAnswers]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    // เงื่อนไขใหม่: posttestDueDate === true, progress >= 80, hasPosttestAnswers === false
    if (
      hasPretestAnswers &&
      posttestDueDate === true &&
      (progress?.progressPercentage ?? 0) >= 80 &&
      hasPosttestAnswers === false
    ) {
      openPosttestModal();
    }
  }, [hasPretestAnswers, hasPosttestAnswers, posttestDueDate, progress?.progressPercentage]);

  const handlePretestSubmit = async () => {
    if (!pretestAnswersInput || pretestAnswersInput.length === 0) {
      addToast({ title: 'No Answer to Submit.', color: 'danger' });
      return;
    }
    try {
      const payload = {
        answers: pretestAnswersInput.map(ans => ({ pretest: ans.pretest, answer: ans.answer })),
      };
      const res = await createPretestAnswers(payload);
      if (res) {
        addToast({ title: 'Submit Successfully.', color: 'success' });
        await fetchPrepostQuestion();
        await fetchPretestAnswers();
        setIsPretestModalOpen(false);
        setSelectedPretestQuestions([]);
        await fetchPrepostQuestion();
      } else {
        addToast({ title: 'Failed to Submit Answer.', color: 'danger' });
      }
    } catch (err) {
      addToast({ title: 'Error Submit Answer.', color: 'danger' });
    }
  };

  const handlePosttestSubmit = async () => {
    if (!posttestAnswersInput || posttestAnswersInput.length === 0) {
      addToast({ title: 'No Answer to Submit.', color: 'danger' });
      return;
    }
    try {
      const payload = {
        answers: posttestAnswersInput.map(ans => ({ posttest: ans.posttest, answer: ans.answer })),
      };
      const res = await createPosttestAnswers(payload);
      if (res) {
        addToast({ title: 'Submit Successfully.', color: 'success' });
        await fetchPrepostQuestion();
        setIsPosttestModalOpen(false);
        setSelectedPosttestQuestions([]);
      } else {
        addToast({ title: 'Failed to Submit Answer.', color: 'danger' });
      }
    } catch (err) {
      addToast({ title: 'Error Submit Answer.', color: 'danger' });
    }
  };

  const shouldBlur = pathname !== '/';

  const hideProgressSummary =
    pathname.match(/^\/chat\/[^\/]+$/); // เฉพาะหน้าแชทห้อง (chat/[id])

  // ซ่อน BottomNav เฉพาะหน้าแชทห้อง
  const hideBottomNav = pathname.match(/^\/chat\/[^\/]+$/); // เฉพาะหน้าแชทห้อง (chat/[id])

  return (
    <>
      <SSEListener />
      <div className="relative h-dvh w-full overflow-hidden pb-24">
        {assets && assets.background ? (
          assets.background.endsWith('.mp4') ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-screen h-screen object-cover z-0"
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.background}`}
            />
          ) : (
            <Image
              fill
              priority
              alt="Background"
              className="absolute inset-0 object-cover z-0"
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.background}`}
            />
          )
        ) : (
          <Image
            fill
            priority
            alt="Background"
            className="absolute inset-0 object-cover z-0"
            src={lobby}
          />
        )}
        <div
          className="absolute inset-0 z-10 pointer-events-none transition-all duration-500"
          style={{
            backdropFilter: `blur(${shouldBlur ? 8 : 0}px)`,
            WebkitBackdropFilter: `blur(${shouldBlur ? 8 : 0}px)`,
            backgroundColor: shouldBlur ? 'rgba(0,0,0,0.1)' : 'transparent',
            opacity: shouldBlur ? 1 : 0,
          }}
        />

        <div className="relative z-20 flex h-full flex-col text-foreground">
          <div className="fixed top-0 left-0 right-0 z-40">
            {!hideProgressSummary && (
              <ProgressBar
                avatarUrl={(assets && assets.profile)
                  ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.profile}`
                  : ""
                }
                onClickAvatar={() => router.push('/profile')}
              />
            )}
          </div>

          <main
            className={`relative flex-1 overflow-y-auto mt-24 md:mt-32 px-4 md:px-8 transition-opacity duration-500`}
          >
            {children}
          </main>

          <PretestQuestionModal
            answers={pretestAnswersInput}
            isOpen={isPretestModalOpen}
            prePostQuestions={selectedPretestQuestions}
            setAnswers={setPretestAnswersInput}
            onClose={() => {
              if (hasPretestAnswers === false) {
                addToast({ title: 'You must complete the pretest first.', color: 'warning' });
                return;
              }
              setIsPretestModalOpen(false);
              setSelectedPretestQuestions([]);
            }}
            onSubmit={() => handlePretestSubmit()}
          />

          <PosttestQuestionModal
            answers={posttestAnswersInput}
            isOpen={isPosttestModalOpen}
            prePostQuestions={selectedPosttestQuestions}
            setAnswers={setPosttestAnswersInput}
            onClose={() => {
              if (hasPosttestAnswers === false) {
                addToast({ title: 'You must complete the posttest first.', color: 'warning' });
                return;
              }
              setIsPosttestModalOpen(false);
              setSelectedPosttestQuestions([]);
            }}
            onSubmit={() => handlePosttestSubmit()}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 mx-4 pb-4 h-20">
            <BottomNav />
          </div>
        </div>
      </div>
    </>
  );
}
