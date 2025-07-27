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
import GlassButton from '@/components/ui/glass-button';
import { Bell } from 'lucide-react';
import NotificationsPage from './notifications/page';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, fetchUser } = useProfile();
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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
    if (hasPretestAnswers === false && prepostQuestion.length > 0) {
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
    pathname.match(/^\/community\/chat\/[^\/]+$/); // เฉพาะหน้าแชทห้อง (community/chat/[id])
  const hideBottomNav = pathname.match(/^\/community\/chat\/[^\/]+$/); // เฉพาะหน้าแชทห้อง (community/chat/[id])
  const hideNotification = pathname.startsWith('/community/coin-hunting')
    || pathname.match(/^\/community\/chat\/[^\/]+$/); // เฉพาะหน้าแชทห้อง (community/chat/[id]);

  const schoolAcronym = ["ADT", "AI", "CSC", "DENT", "HS", "IM", "LA", "LAW", "MED", "NS", "SCI", "SINO", "SOCIN", "SOM"];
  const acronym = user?.metadata?.major?.school?.acronym?.toUpperCase();
  const videoAcronym = schoolAcronym.includes(acronym ?? "") ? acronym : "DENT";

  return (
    <>
      <SSEListener />
      <div className="relative h-dvh w-full overflow-hidden pb-24">

        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-screen h-screen object-cover z-0"
          src={`/images/lobby/${videoAcronym}.mp4`}
        />

        <div
          className="absolute inset-0 z-10 pointer-events-none transition-all duration-500"
          style={{
            backdropFilter: `blur(${shouldBlur ? 16 : 0}px)`,
            WebkitBackdropFilter: `blur(${shouldBlur ? 16 : 0}px)`,
            backgroundColor: shouldBlur ? 'rgba(0,0,0,0.4)' : 'transparent',
            opacity: shouldBlur ? 1 : 0,
          }}
        />

        <div className="relative z-20 flex h-full flex-col text-foreground">
          <div className="flex justify-between fixed top-0 left-0 right-0 mx-4 mt-6 z-40">
            {!hideProgressSummary && (
              <ProgressBar
                avatarUrl={(user && user.metadata?.major?.school?.photos?.avatar)
                  ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.metadata?.major?.school.photos.avatar}`
                  : (assets && assets.profile)
                    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.profile}`
                    : ""
                }
                onClickAvatar={() => router.push('/profile')}
              />
            )}
            {!hideNotification && (
              <GlassButton
                iconOnly
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 z-50"
                onClick={() => setIsNotificationOpen(true)}
              >
                {assets && assets.notification ? (
                  <Image
                    alt="Notification"
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.notification}`}
                    width={20}
                    height={20}
                  />
                ) : (
                  <Bell className="text-white" size={20} />
                )}
              </GlassButton>
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

          {!hideBottomNav && (
            <div className="fixed bottom-0 left-0 right-0 z-50 mx-4 pb-4 h-20">
              <BottomNav />
            </div>
          )}
        </div>
      </div>

      {!hideNotification && (
        <NotificationsPage
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
        />
      )}
    </>
  );
}
