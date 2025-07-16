'use client';
import {
  addToast,
  Button,
  Card,
  CardBody,
  Chip,
  ScrollShadow,
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

export default function ActivitiesDetailPage() {
  const { id } = useParams<{ id: string }>();
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

  const [activeTab, setActiveTab] = useState<'about' | 'status'>('about');
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

  const handleConfirmModal = async () => {
    await handleSubmit();
    setIsConfirmOpen(false);
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
        <div className="flex items-center justify-center min-h-screen">
          <Spinner label="Loading..." variant="wave" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          <Card className="w-full aspect-video relative mb-4">
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
          <Card>
            <div className="justify-between items-center p-4">
              <div className="flex-col flex items-star mt-5 p-2">
                <div className="flex justify-between w-full items-center">
                  <div className="flex flex-col gap-2 flex-1">
                    <p className="text-xs">ACTIVITY</p>
                    <p className="flex items-center font-bold text-xl">
                      {activity?.name.en}
                    </p>
                    <div className="flex items-center gap-2">
                      <Chip variant="flat">
                        <div className="flex gap-1 items-center font-bold">
                          <MapPin size={16} />
                          <p>{activity?.location.en}</p>
                        </div>
                      </Chip>

                      {/* Status Chip */}
                      <CheckinStatusChip
                        assessmentStatus={activity.hasAnsweredAssessment}
                        status={activity.checkinStatus}
                        onClick={() => {
                          if (activity.checkinStatus === 0) {
                            addToast({
                              title: 'You have not checked in yet.',
                              color: 'warning',
                            });
                          } else {
                            setIsModalOpen(true);
                          }
                        }}
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
            </div>
            <CardBody className="overflow-y-hidden">
              <div className="flex justify-center items-center w-full gap-6 border-b border-white/20">
                {[
                  { key: 'about', label: 'ABOUT' },
                  { key: 'status', label: 'ACTIVITY STATUS' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`relative  py-2 text-xs font-bold transition-colors duration-300 border-b-2 ${
                      activeTab === tab.key
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-400 hover:text-black'
                    }`}
                    onClick={() => setActiveTab(tab.key as 'about' | 'status')}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 px-4">
                {activeTab === 'about' ? (
                  <div className="flex flex-col gap-8 justify-between">
                    <div className="flex items-center justify-center">
                      <ScrollShadow className="w-full flex flex-col break-all">
                        {activity?.fullDetails?.en || 'No details available.'}
                      </ScrollShadow>
                    </div>

                    <Button
                      className="text-center font-bold text-xs w-full"
                      radius="md"
                      startContent={<MapPin size={15} />}
                      variant="flat"
                      onPress={HandleViewMap}
                    >
                      Open in Google Maps
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Stepper activity={activity} />
                  </div>
                )}
              </div>
            </CardBody>
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
        onSubmit={() => setIsConfirmOpen(true)}
      />
      {/*Confirm modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        subtitle="Are you sure you want to submit your answers? You won't be able to change them after submission."
        title="Do you want to submit your answers?"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmModal}
      />
    </>
  );
}
