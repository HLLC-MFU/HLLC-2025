'use client';

import { Button } from '@heroui/react';
import { QrCode, Clock, CheckCircle, FileText } from 'lucide-react';

import StepperItem from './StepperItem';

export default function StepperActivity({
  activity,
  router,
  setShowAssessmentModal,
}: any) {
  return (
    <div className="pb-5">
      {/* Step 1: Activity Start */}
      <StepperItem
        active={activity.checkinStatus === 0}
        completed={activity.checkinStatus > 0}
        description={
          activity.checkinStatus !== 0
            ? activity.checkinStatus < 0
              ? 'You missed the activity. If you were unable to check in due to a technical problem or other reason, please reach out to MFU Activity.'
              : `Activity begins at ${new Date(
                  activity.metadata.startAt,
                ).toLocaleString([], {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}. Please be ready to participate.`
            : undefined
        }
        disabled={activity.checkinStatus === 0}
        error={activity.checkinStatus < 0}
        icon={Clock}
        index={1}
        label={
          activity.checkinStatus < 0
            ? 'Activity Missed'
            : activity.checkinStatus === 0
              ? 'Waiting to Start'
              : activity.checkinStatus > 0
                ? 'Activity Started'
                : 'Activity Ended'
        }
      >
        {activity.checkinStatus === 0 && (
          <div className="bg-amber-100 p-3 rounded-lg border-l-4 border-amber-500">
            <p className="text-amber-900 text-sm leading-5">
              ⏳ Check back when the activity starts to proceed with check-in.
            </p>
          </div>
        )}
      </StepperItem>

      {/* Step 2: Check-in */}
      {activity.checkinStatus !== -1 && (
        <StepperItem
          active={activity.checkinStatus === 1}
          completed={activity.checkinStatus >= 2}
          description={
            activity.checkinStatus > 1
              ? 'You have successfully checked in. Enjoy the activity!'
              : activity.checkinStatus < 0
                ? undefined
                : 'Scan the QR code at the event location or visit the designated check-in point to confirm your attendance.'
          }
          disabled={activity.checkinStatus === 0}
          error={activity.checkinStatus < 0}
          icon={QrCode}
          index={2}
          label={
            activity.checkinStatus > 1
              ? 'Successfully Checked In'
              : activity.checkinStatus < 0
                ? 'Cannot Check-In'
                : 'Check-In Required'
          }
        >
          {activity.checkinStatus === 1 && (
            <Button
              className="bg-blue-600 text-white mt-4 rounded-md"
              size="sm"
              onPress={() => router.replace('/qrcode')}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Open QR Scanner
            </Button>
          )}
        </StepperItem>
      )}

      {/* Step 3: Checked In */}
      {activity.checkinStatus !== -1 && (
        <StepperItem
          active={activity.checkinStatus === 2}
          completed={activity.checkinStatus === 3}
          description={
            activity.checkinStatus < 0
              ? undefined
              : activity.checkinStatus === 3
                ? "Congratulations! You've completed the activity. Please take a moment to share your feedback through the assessment."
                : "Great! You're all set. Enjoy the activity and stay engaged throughout the session."
          }
          disabled={activity.checkinStatus === 0}
          error={activity.checkinStatus < 0}
          icon={CheckCircle}
          index={3}
          label={
            activity.checkinStatus === 3
              ? 'Activity Completed'
              : 'Activity Ongoing'
          }
        />
      )}

      {/* Step 4: Assessment */}
      <StepperItem
        isLast
        active={!activity.hasAnsweredAssessment && activity.checkinStatus === 3}
        completed={activity.hasAnsweredAssessment}
        description="Help us improve by sharing your experience and feedback about this activity."
        disabled={activity.checkinStatus < 3}
        error={!activity.hasAnsweredAssessment && activity.checkinStatus === 3}
        icon={FileText}
        index={4}
        label="Evaluation"
      >
        <div className="bg-sky-50 p-3 rounded-lg border-l-4 border-sky-500">
          <p className="text-blue-900 text-sm leading-5 mb-2">
            💭 Your feedback is valuable and helps us create better experiences
            for everyone.
          </p>
          {!activity.hasAnsweredAssessment && activity.checkinStatus === 3 && (
            <Button
              className="bg-emerald-500 text-white rounded-md"
              size="sm"
              onPress={() => setShowAssessmentModal(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Complete Assessment
            </Button>
          )}
        </div>
      </StepperItem>
    </div>
  );
}

// import { Check } from 'lucide-react';

// export interface Step {
//   title: string;
//   value?: string;
// }

// export interface StepperProps {
//   steps: Step[];
//   direction?: 'horizontal' | 'vertical';
//   completedSteps: number[]; // list step ที่เสร็จแล้ว (1-based indices)
// }

// export default function Stepper({
//   steps,
//   direction = 'horizontal',
//   completedSteps,
// }: StepperProps) {
//   return (
//     <div
//       className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} relative`}
//     >
//       {steps.map((step, i) => {
//         const stepIndex = i + 1;
//         const isCompleted = completedSteps.includes(stepIndex);

//         return (
//           <div
//             key={i}
//             className={`relative flex ${
//               direction === 'horizontal'
//                 ? 'flex-col items-center w-36'
//                 : 'flex-row items-center mb-8'
//             }`}
//           >
//             {/* Connecting Line */}
//             {i !== 0 && (
//               <div
//                 className={`absolute ${
//                   direction === 'horizontal'
//                     ? 'top-[20px] -left-1/2 w-full h-[3px]'
//                     : 'left-[20px] -top-10 h-full w-[3px]'
//                 }
//                 ${isCompleted ? 'bg-green-600' : 'bg-slate-200'}
//                 z-0`}
//               />
//             )}

//             {/* Circle */}
//             <div
//               className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-white relative z-10
//               ${isCompleted ? 'bg-green-600' : 'bg-slate-700'}
//             `}
//             >
//               {isCompleted ? <Check size={20} /> : stepIndex}
//             </div>

//             {/* Step Label */}
//             <div
//               className={`${direction === 'horizontal' ? 'mt-2 text-center' : 'ml-4 flex flex-col'}`}
//             >
//               <span className="font-bold text-sm">{step.title}</span>
//               {step.value && (
//                 <span className="text-xs text-gray-500">{step.value}</span>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }
