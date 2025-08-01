'use client';
import {
  addToast,
  Button,
  Card,
  Divider,
  ScrollShadow,
  Skeleton,
  Spinner,
} from '@heroui/react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import DateBadge from '../_components/DateBadge';
import CheckinStatusChip from '../_components/CheckinStatusChip';

import Stepper from './_components/Stepper';
import AssessmentModal from './_components/AssessementModal';
import { ConfirmationModal } from './_components/ConfirmModal';

import { Assessment } from '@/types/assessment';
import { useActivities } from '@/hooks/useActivities';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

export default function ActivitiesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const {
    loading,
    activities,
    assessments,
    answers,
    setAnswers,
    createAssessmentAnswers,
    fetchActivitiesByUser,
  } = useActivities(id);

  const activity = useMemo(
    () => activities.find(a => a._id === id),
    [activities, id],
  );

  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssessments, setSelectedAssessments] = useState<Assessment[]>(
    [],
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleCloseModal = () => {
    if (activity?.hasAnsweredAssessment) {
      setIsModalOpen(false);
      setSelectedAssessments([]);
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
          assessment: ans.assessment,
          answer: ans.answer,
        })),
      };

      const res = await createAssessmentAnswers(payload);

      if (res) {
        addToast({
          title: 'Submit Successfully.',
          color: 'success',
        });
        setIsModalOpen(false);
        setSelectedAssessments([]);
        await fetchActivitiesByUser();
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

  const HandleViewMap = () => {
    if (activity?.location?.mapUrl) {
      window.open(activity.location.mapUrl, '_blank');
    } else {
      addToast({
        title: 'No map URL available.',
        color: 'danger',
      });
    }
  };

  const completedSteps: number[] = [];

  if (activity) {
    const now = new Date();
    const startAt = new Date(activity.metadata.startAt);
    const endAt = new Date(activity.metadata.endAt);

    // ✅ Step 1: Started
    if (now >= startAt) {
      completedSteps.push(1);
    }

    // ✅ Step 2: Check-in done
    if (activity.checkinStatus === 2 || activity.checkinStatus === 3) {
      completedSteps.push(2);
    }

    // ✅ Step 3: Ended
    if (now >= endAt) {
      completedSteps.push(3);
    }

    // ✅ Step 4: Assessment done
    if (activity.hasAnsweredAssessment) {
      completedSteps.push(4);
    }
  }

  useEffect(() => {
    if (!activity) return;

    const now = new Date();
    const endAt = new Date(activity.metadata.endAt);

    const isEnded = now >= endAt;
    const isCheckedIn =
      activity.checkinStatus === 2 || activity.checkinStatus === 3;

    if (isEnded && isCheckedIn && !activity.hasAnsweredAssessment) {
      setSelectedAssessments(assessments);
      setIsModalOpen(true);
    }
  }, [activity, assessments]);

  return (
    <>
      {loading || !activity ? (
        <div className="flex flex-col fixed inset-0 w-full h-full m-0">
          {/* Banner Skeleton */}
          <Skeleton className="w-full aspect-[4/3] rounded-none" />

          {/* Bottom Section */}
          <Card className="rounded-none flex-1 overflow-hidden">
            <div className="p-2">
              {/* Tab bar skeleton */}
              <div className="flex justify-center items-center w-full gap-6 border-b border-white/20">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            <ScrollShadow className="overflow-y-auto h-full px-4 py-6" hideScrollBar>
              {/* Activity Info Skeleton */}
              <div className="flex flex-col gap-4">
                {/* Title */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-32" /> {/* subtitle */}
                    <Skeleton className="h-6 w-48 rounded" /> {/* title */}

                    {/* Location + Status */}
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>

                  {/* Date badge */}
                  <Skeleton className="h-10 w-16 rounded-md" />
                </div>

                <Divider />

                {/* Full Details */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-[90%] rounded" />
                  <Skeleton className="h-4 w-[80%] rounded" />
                  <Skeleton className="h-4 w-[60%] rounded" />
                </div>

                {/* Map Button */}
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </div>
            </ScrollShadow>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col fixed inset-0 w-full h-full m-0">
          <Card className="w-full aspect-square relative rounded-none">
            <Image
              fill
              alt="Banner"
              className="w-full h-full object-cover"
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity?.photo?.bannerPhoto}`}
            />
            <div className="flex items-center gap-4 p-4 absolute z-10">
              <Button
                isIconOnly
                radius="full"
                size="md"
                variant="shadow"
                onPress={() => router.back()}
              >
                <ArrowLeft color="black" size={16} />
              </Button>
            </div>
          </Card>
          <Card className="rounded-none h-full overflow-hidden">
            <div className="justify-between items-center p-2">
              {/* Tab Content */}
              <div className="flex justify-center items-center w-full gap-6 border-b border-white/20">
                {[
                  { key: 'details', label: t('activity.details') },
                  { key: 'timeline', label: t('activity.timeline.title') },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`relative py-2 text-md font-bold transition-colors duration-300 border-b-2 ${activeTab === tab.key
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-400 hover:text-black'
                      }`}
                    onClick={() => setActiveTab(tab.key as 'details' | 'timeline')}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <ScrollShadow className="overflow-y-auto h-full pb-8" hideScrollBar>
              <div className="px-4">
                {activeTab === 'details' ? (
                  <>
                    <div className="flex-col flex items-star mt-5 p-2">
                      <div className="flex justify-between w-full items-center">
                        <div className="flex flex-col gap-2 flex-1">
                          <p className="text-xs">{t('activity.activityTitle')}</p>
                          <p className="flex items-center font-bold text-xl">
                            {activity?.name[language]}
                          </p>
                          <div className="flex flex-col items-start gap-2">
                            {/* Time */}
                            <div className="flex gap-1 items-center text-default-600">
                              <MapPin size={16} />
                              <p>{new Date(activity.metadata.startAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })} - {new Date(activity.metadata.endAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}</p>
                            </div>

                            {/* Location */}
                            <div className="flex gap-1 items-center text-default-600">
                              <MapPin size={16} />
                              <p>{activity?.location[language]}</p>
                            </div>

                            {/* Status */}
                            <CheckinStatusChip
                              assessmentStatus={activity.hasAnsweredAssessment}
                              status={activity.checkinStatus}
                            />
                          </div>
                        </div>

                        {/* Date Badge */}
                        <div>
                          {activity?.metadata?.startAt && (
                            <DateBadge date={activity.metadata.startAt} />
                          )}
                        </div>
                      </div>
                    </div>
                    <Divider className="my-4" />
                    <div className="flex flex-col gap-8 justify-between pb-2">
                      <div className="flex items-center justify-center">
                        <ScrollShadow className="w-full flex flex-col break-all">
                          {activity?.fullDetails[language] || 'No details available.'}
                        </ScrollShadow>
                      </div>

                      <Button
                        className="text-center font-bold text-xs w-full"
                        radius="md"
                        startContent={<MapPin size={15} />}
                        variant="flat"
                        onPress={HandleViewMap}
                      >
                        {t('activity.activityMap')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div>
                    <Stepper activity={activity} router={router} />
                  </div>
                )}
              </div>
            </ScrollShadow>
          </Card>
        </div>
      )}

      {/* Assessment Modal */}
      <AssessmentModal
        answers={answers}
        assessment={selectedAssessments}
        isOpen={isModalOpen}
        setAnswers={setAnswers}
        onClose={handleCloseModal}
        onSubmit={() => handleSubmit()}
      />
    </>
  );
}
