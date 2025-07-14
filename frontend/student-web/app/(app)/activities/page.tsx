'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@heroui/react';
import { Search } from 'lucide-react';
import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';

import ActivityCard from './_components/ActivitiesCard';
import ActivityCardSkeleton from './_components/ActivityCardSkeleton';

import { useActivities } from '@/hooks/useActivities';
import { PrepostQuestions } from '@/types/prepostQuestion';
import { usePrepostQuestion } from '@/hooks/usePrePostQuestion';
import useProgress from '@/hooks/useProgress';
import PretestQuestionModal from '@/components/PretestPosttest/PretestQuestionModal';
import { ConfirmationModal } from '@/components/PretestPosttest/ConfirmModal';

export default function ActivitiesPage() {
  const { activities, loading } = useActivities(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  const {
    answers,
    createPretestAnswers,
    fetchPrepostQuestion,
    setAnswers,
    prepostQuestion,
    pretestAnswers,
    hasPretestAnswers,
  } = usePrepostQuestion();
  const { progress } = useProgress();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrepostQuestion, setSelectedPrepostQuestion] = useState<
    PrepostQuestions[]
  >([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const openPretestModal = () => {
    const filteredQuestions = prepostQuestion.filter(
      q => q.displayType === 'pretest' || q.displayType === 'both',
    );

    setSelectedPrepostQuestion(filteredQuestions);

    // กำหนด answers เริ่มต้นให้ตรงกับคำถามทุกข้อ
    const initialAnswers = filteredQuestions.map(q => {
      // หาใน answers ที่มีคำตอบเดิม (ถ้ามี)
      const existingAnswer = answers.find(ans => ans.pretest === q._id);

      return existingAnswer || { pretest: q._id, answer: '' };
    });

    setAnswers(initialAnswers);

    setIsModalOpen(false);
  };

  useEffect(() => {
    if (hasPretestAnswers === null) return;

    if (!hasPretestAnswers) {
      openPretestModal();
    }
  }, [hasPretestAnswers]);


  const handleSubmit = async () => {
    if (!answers || answers.length === 0) {
      addToast({
        title: 'No Answer to Submit.',
        color: 'danger',
      });

      return;
    }

    try {
      const payload = {
        answers: answers.map(ans => ({
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
        setIsModalOpen(false);
        setSelectedPrepostQuestion([]);
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

  const handleConfirmModal = async () => {
    await handleSubmit();
    setIsConfirmOpen(false);
  };

  const filteredAndSortedActivities = useMemo(() => {
    if (!activities) return [];

    let filtered = activities;

    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();

      filtered = activities.filter(
        a =>
          a.name?.en?.toLowerCase().includes(lower) ||
          a.name?.th?.toLowerCase().includes(lower) ||
          a.acronym?.toLowerCase().includes(lower),
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (a.name?.en ?? '').localeCompare(b.name?.en ?? '');
          break;
        case 'acronym':
          comparison = (a.acronym ?? '').localeCompare(b.acronym ?? '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [activities, searchQuery, sortBy, sortDirection]);

  const upcomingActivity = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const now = new Date();

    // Filter by search query first, same as filteredAndSortedActivities logic
    let filtered = activities;

    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();

      filtered = activities.filter(
        a =>
          a.name?.en?.toLowerCase().includes(lower) ||
          a.name?.th?.toLowerCase().includes(lower) ||
          a.acronym?.toLowerCase().includes(lower),
      );
    }

    // Then filter to future activities only
    const futureActivities = filtered
      .filter(a => new Date(a.metadata?.startAt) > now)
      .sort(
        (a, b) =>
          new Date(a.metadata.startAt).getTime() -
          new Date(b.metadata.startAt).getTime(),
      );

    return futureActivities[0] ?? null;
  }, [activities, searchQuery]);

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-y-auto pb-16 gap-6 bg-transparent px-8"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Search Input */}
      <div className="mb-6">
        <Input
          aria-label="Search activities"
          className="w-full max-w-md "
          placeholder="Search activities..."
          radius="full"
          size="lg"
          startContent={<Search className="text-default-500" size={20} />}
          type="search"
          value={searchQuery}
          variant="faded"
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-5">
        {upcomingActivity && !loading && (
          <div>
            <ActivityCard
              activity={upcomingActivity}
              onClick={() => router.push(`/activities/${upcomingActivity._id}`)}
            />
          </div>
        )}
        {loading && <ActivityCardSkeleton />}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <ActivityCardSkeleton key={i} />
            ))
          : filteredAndSortedActivities.map(activity => (
              <ActivityCard
                key={activity._id}
                activity={activity}
                onClick={() => router.push(`/activities/${activity._id}`)}
              />
            ))}
      </div>

      {!loading && filteredAndSortedActivities?.length === 0 && (
        <p className="text-center text-sm text-default-500">
          No activities found.
        </p>
      )}

      <PretestQuestionModal
        answers={answers}
        isOpen={isModalOpen}
        prePostQuestions={selectedPrepostQuestion}
        setAnswers={setAnswers}
        onClose={() => {
          if (progress?.progressPercentage) {
            setIsModalOpen(false);
            setSelectedPrepostQuestion([]);
          } else {
            addToast({
              title: 'You must complete the assessment first.',
              color: 'warning',
            });
          }
        }}
        onSubmit={() => setIsConfirmOpen(true)}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        subtitle="Are you sure you want to submit your answers? You won't be able to change them after submission."
        title="Do you want to submit your answers?"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmModal}
      />
    </div>
  );
}
