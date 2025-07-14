'use client';
import { useEffect, useMemo, useState } from 'react';
import ActivitiesList from './_components/ActivitiesList';
import { ActivitiesFilters } from './_components/ActivitiesFilters';
import UpcomingCard from './_components/UpcomingCard';
import { useActivities } from '@/hooks/useActivities';
import { PrepostQuestions } from '@/types/prepostQuestion';
import { addToast } from '@heroui/react';
import { usePrepostQuestion } from '@/hooks/usePrePostQuestion';
import { useProgress } from '@/hooks/useProgress';
import PretestQuestionModal from '@/components/PretestPosttest/PretestQuestionModal';
import { ConfirmationModal } from '@/components/PretestPosttest/ConfirmModal';

export default function ActivitiesPage() {
  const { activities, loading } = useActivities(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { answers, createPretestAnswers, fetchPrepostQuestion, setAnswers, prepostQuestion, pretestAnswers, hasPretestAnswers } = usePrepostQuestion();
  const { progress, progressLoading } = useProgress();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrepostQuestion, setSelectedPrepostQuestion] = useState<PrepostQuestions[]>(
    [],
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const openPretestModal = () => {
    const filteredQuestions = prepostQuestion.filter(
      q => q.displayType === 'pretest' || q.displayType === 'both'
    );

    setSelectedPrepostQuestion(filteredQuestions);

    // กำหนด answers เริ่มต้นให้ตรงกับคำถามทุกข้อ
    const initialAnswers = filteredQuestions.map(q => {
      // หาใน answers ที่มีคำตอบเดิม (ถ้ามี)
      const existingAnswer = answers.find(ans => ans.pretest === q._id);
      return existingAnswer || { pretest: q._id, answer: '' };
    });

    setAnswers(initialAnswers);

    setIsModalOpen(true);
  };

  useEffect(() => {
    if (hasPretestAnswers === null) return;

    if (!hasPretestAnswers) {
      openPretestModal();
    }
  }, [hasPretestAnswers]);


  const handleCloseModal = () => {
    if (progress?.progressPercentage) {
      setIsModalOpen(false);
      setSelectedPrepostQuestion([]);
    } else {
      addToast({
        title: 'You must complete the assessment first.',
        color: 'warning',
      });
    }
  };

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
    const futureActivities = activities
      .filter(a => new Date(a.metadata?.startAt) > now)
      .sort(
        (a, b) =>
          new Date(a.metadata.startAt).getTime() -
          new Date(b.metadata.startAt).getTime(),
      );

    return futureActivities[0] ?? null;
  }, [activities]);

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="flex flex-col min-h-screen justify-beetween gap-5">
      <div className="flex flex-col mt-5 gap-5 justify-between">
        <h1 className="text-3xl font-bold">Activities</h1>
        <ActivitiesFilters
          searchQuery={searchQuery}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSearchQueryChange={setSearchQuery}
          onSortByChange={setSortBy}
          onSortDirectionToggle={toggleSortDirection}
        />
        {/* Upcoming Activities */}
        <div>
          {upcomingActivity && <UpcomingCard activity={upcomingActivity} />}
        </div>
        <h1 className="p-1 ml-2">
          <span className="text-xl font-semibold">All Activities</span>
          {filteredAndSortedActivities.length > 0 && (
            <span className="text-sm text-default-500 ml-2">
              ({filteredAndSortedActivities.length} found)
            </span>
          )}
        </h1>
      </div>
      <ActivitiesList
        key={filteredAndSortedActivities.length}
        activities={filteredAndSortedActivities}
        isLoading={loading}
      />

      {filteredAndSortedActivities?.length === 0 && !loading && (
        <p className="text-center text-sm text-default-500">
          No activities found.
        </p>
      )}

      <PretestQuestionModal
        answers={answers}
        prePostQuestions={selectedPrepostQuestion}
        isOpen={isModalOpen}
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
